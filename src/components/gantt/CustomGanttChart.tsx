import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Calendar, Clock, Settings, Smartphone, Monitor, List, BarChart3, Plus } from 'lucide-react';
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
  onAddTask?: () => void;
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
  mobileBreakpoint: 640,
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
  timelineEnd,
  onAddTask
}: CustomGanttChartProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'timeline'>('list');
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

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= GANTT_CONFIG.mobileBreakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mobile view toggle
  const toggleMobileView = () => {
    setMobileView(prev => prev === 'list' ? 'timeline' : 'list');
  };

  // Process tasks with construction-specific enhancements
  const processedTasks = useMemo(() => {
    // Keep the same order as passed from parent (don't sort here)
    return tasks.map(task => ({
      ...task,
      level: 0,
      hasChildren: false,
      isExpanded: true,
      isCritical: task.priority === 'critical' || task.title?.toLowerCase().includes('critical'),
      resourceNames: [],
      actualProgress: task.progress_percentage || 0,
      predecessors: task.dependencies || [],
      successors: [],
      floatDays: 0
    }));
  }, [tasks]); // Remove any sorting - use tasks as-is

  // Calculate timeline bounds with proper date handling
  const timelineBounds = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      const now = new Date();
      return {
        start: startOfMonth(now),
        end: endOfMonth(addDays(now, 30)),
        days: eachDayOfInterval({
          start: startOfMonth(now),
          end: endOfMonth(addDays(now, 30))
        })
      };
    }

    // Use provided bounds or calculate from tasks
    const start = timelineStart || new Date(Math.min(...tasks.map(t => new Date(t.start_date).getTime())));
    const end = timelineEnd || new Date(Math.max(...tasks.map(t => new Date(t.end_date).getTime())));
    
    // Extend to show full months
    const monthStart = startOfMonth(start);
    const monthEnd = endOfMonth(end);
    
    return {
      start: monthStart,
      end: monthEnd,
      days: eachDayOfInterval({ start: monthStart, end: monthEnd })
    };
  }, [tasks, timelineStart, timelineEnd]);

  // Enhanced mobile-friendly task drag handlers
  const handleTaskDragStart = (task: GanttTask, e: React.MouseEvent | React.TouchEvent, mode: 'horizontal' | 'vertical') => {
    if (readOnly) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDragState({
      isDragging: true,
      dragTaskId: task.id,
      dragStartX: clientX,
      dragStartY: clientY,
      dragStartDate: task.start_date,
      dragMode: mode,
      dropIndex: -1
    });

    if (mode === 'horizontal') {
      handleHorizontalDragStart(task, clientX);
    } else {
      handleVerticalDragStart(task, clientY);
    }
  };

  const handleHorizontalDragStart = (task: GanttTask, startX: number) => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - startX;
      const daysDelta = Math.round(deltaX / GANTT_CONFIG.dayWidth);
      
      if (daysDelta !== 0) {
        const newStartDate = addDays(dragState.dragStartDate!, daysDelta);
        
        // Visual feedback only
        const taskElement = document.querySelector(`[data-task-id="${task.id}"]`) as HTMLElement;
        if (taskElement) {
          taskElement.style.transform = `translateX(${deltaX}px)`;
          taskElement.style.opacity = '0.8';
          taskElement.style.zIndex = '50';
        }
      }
    };

    const handleMouseUp = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - startX;
      const daysDelta = Math.round(deltaX / GANTT_CONFIG.dayWidth);
      
      // Reset visual feedback
      const taskElement = document.querySelector(`[data-task-id="${task.id}"]`) as HTMLElement;
      if (taskElement) {
        taskElement.style.transform = '';
        taskElement.style.opacity = '';
        taskElement.style.zIndex = '';
      }

      if (daysDelta !== 0 && onTaskUpdate) {
        const newStartDate = addDays(dragState.dragStartDate!, daysDelta);
        const duration = differenceInDays(task.end_date, task.start_date);
        const newEndDate = addDays(newStartDate, duration);
        
        onTaskUpdate(task.id, {
          start_date: newStartDate,
          end_date: newEndDate
        });
      }

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
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('touchend', handleMouseUp);
  };

  const handleVerticalDragStart = (task: GanttTask, startY: number) => {
    const taskIndex = processedTasks.findIndex(t => t.id === task.id);
    
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaY = clientY - startY;
      const newIndex = Math.max(0, Math.min(processedTasks.length - 1, 
        taskIndex + Math.round(deltaY / GANTT_CONFIG.rowHeight)));
      
      setDragState(prev => ({ ...prev, dropIndex: newIndex }));

      // Visual feedback
      const taskElement = document.querySelector(`[data-task-row="${taskIndex}"]`) as HTMLElement;
      if (taskElement) {
        taskElement.style.transform = `translateY(${deltaY}px)`;
        taskElement.style.opacity = '0.7';
        taskElement.style.zIndex = '100';
        taskElement.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
      }
    };

    const handleMouseUp = () => {
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
        onTaskReorder?.(task.id, dragState.dropIndex);
      }

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
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('touchend', handleMouseUp);
  };

  // Render timeline header for all devices
  const renderTimelineHeader = () => {
    const months = timelineBounds.days.reduce((acc, day) => {
      const monthKey = format(day, 'yyyy-MM');
      if (!acc[monthKey]) {
        acc[monthKey] = {
          name: format(day, 'MMM yyyy'),
          days: []
        };
      }
      acc[monthKey].days.push(day);
      return acc;
    }, {} as Record<string, { name: string; days: Date[] }>);

    return (
      <div className="gantt-timeline-header">
        <div className="gantt-timeline-months">
          {Object.entries(months).map(([key, month]) => (
            <div
              key={key}
              className="gantt-timeline-month"
              style={{ width: month.days.length * GANTT_CONFIG.dayWidth }}
            >
              {month.name}
            </div>
          ))}
        </div>
        <div className="gantt-timeline-days">
          {timelineBounds.days.map((day, index) => (
            <div
              key={index}
              className={`gantt-timeline-day ${
                day.getDay() === 0 || day.getDay() === 6 ? 'weekend' : ''
              } ${
                format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'today' : ''
              }`}
              style={{ width: GANTT_CONFIG.dayWidth }}
            >
              <div className="day-number">{format(day, 'd')}</div>
              <div className="day-name">{format(day, 'EEE')}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };



  // Render task row with mobile responsiveness
  const renderTaskRow = (task: GanttTask, index: number) => {
    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.end_date);
    const startOffset = differenceInDays(taskStart, timelineBounds.start) * GANTT_CONFIG.dayWidth;
    const taskWidth = Math.max(GANTT_CONFIG.dayWidth, differenceInDays(taskEnd, taskStart) * GANTT_CONFIG.dayWidth);

    const getStatusClass = (status: string) => {
      switch (status) {
        case 'completed': return 'completed';
        case 'in_progress': return 'in-progress';
        case 'overdue': return 'overdue';
        default: return '';
      }
    };

    const statusClass = getStatusClass(task.status);
    const criticalClass = task.isCritical ? 'critical' : '';

    return (
      <div
        key={task.id}
        className={`gantt-task-row ${dragState.dropIndex === index ? 'drag-target' : ''}`}
        data-task-row={index}
        style={{ 
          height: isMobile ? 'auto' : GANTT_CONFIG.rowHeight,
          minHeight: isMobile ? '80px' : GANTT_CONFIG.rowHeight
        }}
      >
        {/* Task Name Cell */}
        <div
          className="gantt-task-name-cell"
          onClick={() => onTaskClick?.(task)}
          style={{ 
            width: isMobile ? '100%' : GANTT_CONFIG.taskNameWidth,
            cursor: 'pointer'
          }}
        >
          <div
            className="gantt-drag-handle"
            onMouseDown={(e) => !isMobile && handleTaskDragStart(task, e, 'vertical')}
            onTouchStart={(e) => isMobile && handleTaskDragStart(task, e, 'vertical')}
          >
            ⋮⋮
          </div>
          <div className="gantt-task-info">
            <div className="gantt-task-name">
              {task.title}
              {task.isCritical && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                  Critical
                </span>
              )}
            </div>
            <div className="gantt-task-meta">
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {safeDateFormat(task.start_date, 'MMM dd')} - {safeDateFormat(task.end_date, 'MMM dd')}
              </span>
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {task.progress_percentage || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Task Timeline - Hidden on mobile in list mode */}
        {(!isMobile || mobileView === 'timeline') && (
          <div 
            className="gantt-task-timeline"
            style={{ height: isMobile ? '60px' : GANTT_CONFIG.rowHeight }}
          >
            <div
              className={`gantt-task-bar ${statusClass} ${criticalClass} ${
                dragState.dragTaskId === task.id ? 'dragging' : ''
              }`}
              data-task-id={task.id}
              style={{
                left: isMobile ? 0 : startOffset,
                width: isMobile ? '100%' : taskWidth,
                height: isMobile ? '24px' : GANTT_CONFIG.taskBarHeight,
                position: isMobile ? 'relative' : 'absolute'
              }}
              onMouseDown={(e) => !isMobile && handleTaskDragStart(task, e, 'horizontal')}
              onTouchStart={(e) => isMobile && handleTaskDragStart(task, e, 'horizontal')}
            >
              <div 
                className="gantt-task-progress"
                style={{ width: `${task.actualProgress}%` }}
              />
              <span className="gantt-task-label">
                {isMobile ? task.title : (taskWidth > 100 ? task.title : '')}
                <span className="progress-text">{task.actualProgress}%</span>
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!processedTasks || processedTasks.length === 0) {
    return (
      <div className="gantt-empty">
        <BarChart3 className="gantt-empty-icon" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks to display</h3>
        <p className="text-gray-600">Add some tasks to see them in the Gantt chart</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`gantt-container ${isMobile ? 'mobile' : 'desktop'}`}
    >
      {/* Header */}
      <div className="gantt-header">
        <div className="gantt-task-names-header">
          <span>Tasks ({processedTasks.length})</span>
          {isMobile && (
            <div className="gantt-mobile-controls">
              <button
                className={`gantt-mobile-toggle ${mobileView === 'list' ? 'active' : ''}`}
                onClick={() => setMobileView('list')}
              >
                <List className="w-3 h-3 mr-1" />
                List
              </button>
              <button
                className={`gantt-mobile-toggle ${mobileView === 'timeline' ? 'active' : ''}`}
                onClick={() => setMobileView('timeline')}
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                Timeline
              </button>
            </div>
          )}
        </div>
        {renderTimelineHeader()}
      </div>

      {/* Content */}
      <div className={`gantt-content ${isMobile && mobileView === 'timeline' ? 'timeline-mode' : ''}`}>
        {/* Today Line - Desktop only */}
        {!isMobile && (() => {
          const today = new Date();
          const todayPosition = differenceInDays(today, timelineBounds.start) * GANTT_CONFIG.dayWidth;

          if (today >= timelineBounds.start && today <= timelineBounds.end) {
            return (
              <div
                className="gantt-today-line"
                style={{
                  left: GANTT_CONFIG.taskNameWidth + todayPosition,
                  zIndex: 30
                }}
              />
            );
          }
          return null;
        })()}

        {/* Task Rows */}
        {processedTasks.map((task, index) => renderTaskRow(task, index))}
      </div>

      {/* Floating Add Task Button */}
      <div className="gantt-floating-add-button">
        <button
          onClick={() => onAddTask?.()}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
          title="Add New Task"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile View Toggle Button */}
      {isMobile && (
        <button
          className="gantt-mobile-view-toggle"
          onClick={toggleMobileView}
        >
          {mobileView === 'list' ? (
            <>
              <BarChart3 className="w-4 h-4 mr-2" />
              Show Timeline
            </>
          ) : (
            <>
              <List className="w-4 h-4 mr-2" />
              Show List
            </>
          )}
        </button>
      )}
    </div>
  );
} 