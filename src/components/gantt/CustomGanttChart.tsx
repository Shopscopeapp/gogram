import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, User, Calendar, Clock, Settings } from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, differenceInDays, parseISO, isValid } from 'date-fns';
import type { Task } from '../../types';
import { safeDateFormat } from '../../utils/dateHelpers';
import './CustomGantt.css';

interface CustomGanttChartProps {
  tasks: Task[];
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick?: (task: Task) => void;
  onTaskReorder?: (draggedTaskId: string, targetIndex: number) => void;
  readOnly?: boolean;
  showDependencies?: boolean;
  timelineStart?: Date;
  timelineEnd?: Date;
}

interface GanttTask extends Task {
  level: number;
  isExpanded?: boolean;
  hasChildren?: boolean;
  children?: GanttTask[];
  isCritical?: boolean;
  resourceNames?: string[];
  actualProgress?: number;
  predecessors?: string[];
  successors?: string[];
  floatDays?: number;
}

const GANTT_CONFIG = {
  rowHeight: 60,
  taskBarHeight: 32,
  timelineHeaderHeight: 80,
  taskNameWidth: 320,
  dayWidth: 30,
  minChartHeight: 400,
  colors: {
    primary: '#3b82f6',
    secondary: '#10b981', 
    tertiary: '#8b5cf6',
    completed: '#22c55e',
    overdue: '#ef4444',
    critical: '#dc2626',
    dependency: '#6b7280',
    background: '#f8fafc',
    grid: '#e2e8f0',
    text: '#334155',
    milestone: '#f59e0b'
  }
};

export default function CustomGanttChart({
  tasks,
  onTaskUpdate,
  onTaskClick,
  onTaskReorder,
  readOnly = false,
  showDependencies = true,
  timelineStart,
  timelineEnd
}: CustomGanttChartProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dragState, setDragState] = useState({
    isDragging: false,
    dragTaskId: null as string | null,
    dragStartX: 0,
    dragStartY: 0,
    dragStartDate: null as Date | null,
    dragMode: 'none' as 'none' | 'horizontal' | 'vertical',
    dropIndex: -1
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Process tasks with construction-specific enhancements
  const processedTasks = useMemo(() => {
    return tasks.map(task => ({
      ...task,
      level: 0,
      hasChildren: false,
      isExpanded: true,
      isCritical: task.priority === 'critical' || task.title?.toLowerCase().includes('critical'),
      resourceNames: task.assigned_to ? [task.assigned_to] : [],
      actualProgress: task.progress_percentage || 0,
      predecessors: task.dependencies || [],
      successors: [],
      floatDays: 0
    }));
  }, [tasks]);

  // Calculate timeline bounds with proper date handling
  const timelineBounds = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      const now = new Date();
      return {
        start: startOfMonth(now),
        end: endOfMonth(addDays(now, 30))
      };
    }

    // Parse dates safely
    const validDates = tasks.reduce<Date[]>((dates, task) => {
      const startDate = typeof task.start_date === 'string' 
        ? parseISO(task.start_date) 
        : new Date(task.start_date);
      const endDate = typeof task.end_date === 'string' 
        ? parseISO(task.end_date) 
        : new Date(task.end_date);

      if (isValid(startDate)) dates.push(startDate);
      if (isValid(endDate)) dates.push(endDate);
      return dates;
    }, []);

    if (validDates.length === 0) {
      const now = new Date();
      return {
        start: startOfMonth(now),
        end: endOfMonth(addDays(now, 30))
      };
    }

    const earliestDate = new Date(Math.min(...validDates.map(d => d.getTime())));
    const latestDate = new Date(Math.max(...validDates.map(d => d.getTime())));

    return {
      start: timelineStart || startOfMonth(earliestDate),
      end: timelineEnd || endOfMonth(addDays(latestDate, 7))
    };
  }, [tasks, timelineStart, timelineEnd]);

  // Generate timeline days
  const timelineDays = eachDayOfInterval({
    start: timelineBounds.start,
    end: timelineBounds.end
  });

  const totalTimelineWidth = timelineDays.length * GANTT_CONFIG.dayWidth;

  // Handle task click
  const handleTaskClick = (task: GanttTask, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskId(task.id);
    onTaskClick?.(task);
  };

  // Handle horizontal drag for date changes
  const handleHorizontalDragStart = (e: React.MouseEvent, task: GanttTask) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Starting horizontal drag for task:', task.title);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const initialX = e.clientX - rect.left;
    const initialDate = new Date(task.start_date);
    
    setDragState({
      isDragging: true,
      dragTaskId: task.id,
      dragStartX: initialX,
      dragStartY: 0,
      dragStartDate: initialDate,
      dragMode: 'horizontal',
      dropIndex: -1
    });

    const handleMouseMove = (e: MouseEvent) => {
      const currentRect = containerRef.current?.getBoundingClientRect();
      if (!currentRect) return;
      
      const currentX = e.clientX - currentRect.left;
      const deltaX = currentX - initialX;
      
      // Visual feedback during drag
      const taskElement = document.querySelector(`[data-task-id="${task.id}"] .gantt-task-bar`) as HTMLElement;
      if (taskElement) {
        taskElement.style.transform = `translateX(${deltaX}px)`;
        taskElement.style.opacity = '0.8';
        taskElement.style.zIndex = '100';
        taskElement.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      console.log('Ending horizontal drag for task:', task.title);
      
      const currentRect = containerRef.current?.getBoundingClientRect();
      if (!currentRect) return;
      
      const currentX = e.clientX - currentRect.left;
      const deltaX = currentX - initialX;
      const daysDelta = Math.round(deltaX / GANTT_CONFIG.dayWidth);
      
      // Reset visual feedback
      const taskElement = document.querySelector(`[data-task-id="${task.id}"] .gantt-task-bar`) as HTMLElement;
      if (taskElement) {
        taskElement.style.transform = '';
        taskElement.style.opacity = '';
        taskElement.style.zIndex = '';
        taskElement.style.boxShadow = '';
      }
      
      // Update task dates if moved significantly
      if (Math.abs(daysDelta) >= 1) {
        const newStartDate = addDays(initialDate, daysDelta);
        const taskDuration = differenceInDays(new Date(task.end_date), new Date(task.start_date));
        const newEndDate = addDays(newStartDate, taskDuration);
        
        console.log('Updating task:', task.id, 'from', task.start_date, 'to', newStartDate);
        
        onTaskUpdate?.(task.id, {
          start_date: newStartDate,
          end_date: newEndDate
        });
      }
      
      // Clean up
      setDragState({
        isDragging: false,
        dragTaskId: null,
        dragStartX: 0,
        dragStartY: 0,
        dragStartDate: null,
        dragMode: 'none',
        dropIndex: -1
      });
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle vertical drag for task reordering
  const handleVerticalDragStart = (e: React.MouseEvent, task: GanttTask, taskIndex: number) => {
    if (readOnly) return;
    
    // Only handle if clicking on the drag handle area
    const target = e.target as HTMLElement;
    if (!target.classList.contains('gantt-drag-handle') && !target.closest('.gantt-drag-handle')) {
      return; // Let other handlers take over
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Starting vertical drag for task:', task.title, 'at index:', taskIndex);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const initialY = e.clientY - rect.top;
    
    setDragState({
      isDragging: true,
      dragTaskId: task.id,
      dragStartX: 0,
      dragStartY: initialY,
      dragStartDate: null,
      dragMode: 'vertical',
      dropIndex: taskIndex
    });

    const handleMouseMove = (e: MouseEvent) => {
      const currentRect = containerRef.current?.getBoundingClientRect();
      if (!currentRect) return;
      
      const currentY = e.clientY - currentRect.top;
      const deltaY = currentY - initialY;
      
      // Calculate which row we're hovering over
      const hoveredRowIndex = Math.floor(currentY / GANTT_CONFIG.rowHeight);
      const clampedIndex = Math.max(0, Math.min(hoveredRowIndex, processedTasks.length - 1));
      
      setDragState(prev => ({ ...prev, dropIndex: clampedIndex }));
      
      // Visual feedback for the dragged task
      const taskElement = document.querySelector(`[data-task-row="${taskIndex}"]`) as HTMLElement;
      if (taskElement) {
        taskElement.style.transform = `translateY(${deltaY}px)`;
        taskElement.style.opacity = '0.7';
        taskElement.style.zIndex = '100';
        taskElement.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
      }
    };

    const handleMouseUp = () => {
      console.log('Ending vertical drag for task:', task.title);
      
      // Reset visual feedback
      const taskElement = document.querySelector(`[data-task-row="${taskIndex}"]`) as HTMLElement;
      if (taskElement) {
        taskElement.style.transform = '';
        taskElement.style.opacity = '';
        taskElement.style.zIndex = '';
        taskElement.style.boxShadow = '';
      }
      
      // Execute reorder if position changed
      if (dragState.dropIndex !== taskIndex && dragState.dropIndex >= 0) {
        console.log('Reordering task:', task.id, 'from index', taskIndex, 'to', dragState.dropIndex);
        onTaskReorder?.(task.id, dragState.dropIndex);
      }
      
      // Clean up
      setDragState({
        isDragging: false,
        dragTaskId: null,
        dragStartX: 0,
        dragStartY: 0,
        dragStartDate: null,
        dragMode: 'none',
        dropIndex: -1
      });
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Render individual task row
  const renderTaskRow = (task: GanttTask, index: number) => {
    console.log('Rendering task:', task.title, task);
    
    const startDate = typeof task.start_date === 'string' ? parseISO(task.start_date) : new Date(task.start_date);
    const endDate = typeof task.end_date === 'string' ? parseISO(task.end_date) : new Date(task.end_date);
    
    console.log('Task dates:', task.title, 'start:', startDate, 'end:', endDate, 'valid start:', isValid(startDate), 'valid end:', isValid(endDate));
    
    if (!isValid(startDate) || !isValid(endDate)) {
      console.error('Skipping task with invalid dates:', task.title);
      return null; // Skip invalid tasks
    }

    const taskStartPosition = differenceInDays(startDate, timelineBounds.start) * GANTT_CONFIG.dayWidth;
    const taskDuration = differenceInDays(endDate, startDate) + 1;
    const taskWidth = Math.max(taskDuration * GANTT_CONFIG.dayWidth, 20); // Minimum width

    console.log('Task positioning:', task.title, 'position:', taskStartPosition, 'width:', taskWidth, 'duration:', taskDuration);

    const getTaskColor = () => {
      if (task.isCritical) return GANTT_CONFIG.colors.critical;
      if (task.status === 'in_progress' && task.progress_percentage === 100) return GANTT_CONFIG.colors.completed;
      if (endDate < new Date() && task.status !== 'in_progress') return GANTT_CONFIG.colors.overdue;
      return GANTT_CONFIG.colors.primary;
    };

    const progressWidth = ((task.actualProgress || 0) / 100) * taskWidth;
    const isMilestone = task.category === 'milestone' || taskDuration <= 1;
    const isSelected = selectedTaskId === task.id;
    const isDragging = dragState.dragTaskId === task.id;
    const isDropTarget = dragState.isDragging && dragState.dragMode === 'vertical' && dragState.dropIndex === index;

    return (
      <div
        key={task.id}
        data-task-id={task.id}
        data-task-row={index}
        className={`gantt-task-row ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
        style={{ height: GANTT_CONFIG.rowHeight }}
      >
        {/* Task Name Column */}
        <div 
          className="gantt-task-name-cell"
          style={{ width: GANTT_CONFIG.taskNameWidth }}
          onClick={(e) => handleTaskClick(task, e)}
        >
          <div className="gantt-task-info">
            <div className="gantt-task-title">
              <span 
                className="gantt-drag-handle"
                onMouseDown={(e) => handleVerticalDragStart(e, task, index)}
                title="Drag to reorder tasks"
              >
                ⋮⋮
              </span>
              {task.title}
              {task.isCritical && <span className="critical-badge">CRITICAL</span>}
              {isMilestone && <span className="milestone-badge">MILESTONE</span>}
            </div>
            <div className="gantt-task-details">
              <span>{safeDateFormat(startDate, 'MMM dd')} - {safeDateFormat(endDate, 'MMM dd')}</span>
              <span>({taskDuration}d)</span>
              {(task.actualProgress || 0) > 0 && <span>{task.actualProgress || 0}%</span>}
            </div>
          </div>
        </div>

        {/* Task Timeline */}
        <div className="gantt-task-timeline" style={{ width: totalTimelineWidth }}>
          {isMilestone ? (
            <div
              className={`gantt-milestone ${task.isCritical ? 'critical' : ''}`}
              style={{
                position: 'absolute',
                left: taskStartPosition,
                top: (GANTT_CONFIG.rowHeight - 20) / 2,
                width: 20,
                height: 20,
                backgroundColor: getTaskColor(),
                transform: 'rotate(45deg)',
                cursor: readOnly ? 'pointer' : 'move'
              }}
              onMouseDown={(e) => !readOnly && handleHorizontalDragStart(e, task)}
              onClick={(e) => handleTaskClick(task, e)}
              title={`Milestone: ${task.title} - Drag to reschedule`}
            />
          ) : (
            <div
              className={`gantt-task-bar ${task.isCritical ? 'critical' : ''} ${isSelected ? 'selected' : ''}`}
              style={{
                position: 'absolute',
                left: taskStartPosition,
                width: taskWidth,
                height: GANTT_CONFIG.taskBarHeight,
                top: (GANTT_CONFIG.rowHeight - GANTT_CONFIG.taskBarHeight) / 2,
                backgroundColor: getTaskColor(),
                cursor: readOnly ? 'pointer' : 'move',
                borderRadius: '4px',
                border: isSelected ? '2px solid #1d4ed8' : task.isCritical ? '2px solid #dc2626' : '1px solid rgba(0,0,0,0.1)',
                zIndex: isSelected ? 20 : task.isCritical ? 15 : 10,
                userSelect: 'none'
              }}
              onMouseDown={(e) => !readOnly && handleHorizontalDragStart(e, task)}
              onClick={(e) => handleTaskClick(task, e)}
              title={`${task.title} (${taskDuration} days) - Drag to reschedule`}
            >
              {/* Progress bar */}
              {progressWidth > 0 && (
                <div
                  className="gantt-task-progress"
                  style={{
                    width: progressWidth,
                    height: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '2px 0 0 2px'
                  }}
                />
              )}
              
              {/* Task label */}
              {taskWidth > 60 && (
                <div className="gantt-task-label">
                  <span>{task.title}</span>
                  {(task.actualProgress || 0) > 0 && <span className="progress-text">{(task.actualProgress || 0)}%</span>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="gantt-container">
        <div className="gantt-empty-state">
          <div className="empty-state-content">
            <Calendar size={48} className="empty-state-icon" />
            <h3>No Tasks Available</h3>
            <p>Add tasks to see them in the Gantt timeline</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="gantt-container"
      style={{ minHeight: GANTT_CONFIG.minChartHeight }}
    >
      {/* Header */}
      <div className="gantt-header">
        <div 
          className="gantt-header-task-names"
          style={{ width: GANTT_CONFIG.taskNameWidth }}
        >
          <h4>Tasks & Resources</h4>
        </div>
        <div 
          className="gantt-header-timeline"
          style={{ width: totalTimelineWidth }}
        >
          <div className="gantt-timeline-months">
            {timelineDays.reduce<Array<{ month: string; width: number; start: number }>>((months, day, index) => {
              const monthKey = format(day, 'MMM yyyy');
              const existing = months.find(m => m.month === monthKey);
              
              if (existing) {
                existing.width += GANTT_CONFIG.dayWidth;
              } else {
                months.push({
                  month: monthKey,
                  width: GANTT_CONFIG.dayWidth,
                  start: index * GANTT_CONFIG.dayWidth
                });
              }
              
              return months;
            }, []).map((month, index) => (
              <div
                key={index}
                className="gantt-month-header"
                style={{
                  left: month.start,
                  width: month.width
                }}
              >
                {month.month}
              </div>
            ))}
          </div>
          <div className="gantt-timeline-days">
            {timelineDays.map((day, index) => {
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              return (
                <div
                  key={index}
                  className={`gantt-day-header ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}`}
                  style={{
                    left: index * GANTT_CONFIG.dayWidth,
                    width: GANTT_CONFIG.dayWidth
                  }}
                >
                  <div className="day-number">{format(day, 'd')}</div>
                  <div className="day-name">{format(day, 'EEE')}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="gantt-content">
        {/* Today Line */}
        {(() => {
          const today = new Date();
          const todayPosition = differenceInDays(today, timelineBounds.start) * GANTT_CONFIG.dayWidth;
          
          // Only show today line if today is within the timeline bounds
          if (today >= timelineBounds.start && today <= timelineBounds.end) {
            return (
              <div 
                className="gantt-today-line"
                style={{
                  left: 320 + todayPosition, // 320px for task name column
                  zIndex: 30
                }}
              />
            );
          }
          return null;
        })()}
        
        {processedTasks.map((task, index) => renderTaskRow(task, index))}
      </div>
    </div>
  );
} 