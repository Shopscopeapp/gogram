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
    textMuted: '#64748b'
  }
};

// Smart dependency management utilities
const calculateDependencyUpdates = (
  movedTask: GanttTask, 
  newStartDate: Date, 
  allTasks: GanttTask[]
): { taskId: string; updates: { start_date: Date; end_date: Date } }[] => {
  const updates: { taskId: string; updates: { start_date: Date; end_date: Date } }[] = [];
  const visited = new Set<string>();
  
  // Get all tasks that depend on the moved task (successors)
  const getSuccessors = (taskId: string): GanttTask[] => {
    return allTasks.filter(task => 
      task.predecessors && task.predecessors.includes(taskId)
    );
  };
  
  // Recursively update dependent tasks
  const updateDependentTasks = (changedTaskId: string, changedEndDate: Date) => {
    if (visited.has(changedTaskId)) return; // Prevent infinite loops
    visited.add(changedTaskId);
    
    const successors = getSuccessors(changedTaskId);
    
    successors.forEach(successor => {
      const currentStartDate = new Date(successor.start_date);
      const currentEndDate = new Date(successor.end_date);
      const taskDuration = differenceInDays(currentEndDate, currentStartDate);
      
      // New start date should be at least 1 day after the predecessor ends
      const newSuccessorStartDate = addDays(changedEndDate, 1);
      const newSuccessorEndDate = addDays(newSuccessorStartDate, taskDuration);
      
      // Only update if the successor needs to be moved forward
      if (newSuccessorStartDate > currentStartDate) {
        updates.push({
          taskId: successor.id,
          updates: {
            start_date: newSuccessorStartDate,
            end_date: newSuccessorEndDate
          }
        });
        
        // Recursively update tasks that depend on this successor
        updateDependentTasks(successor.id, newSuccessorEndDate);
      }
    });
  };
  
  // Start the cascade from the moved task
  const movedTaskDuration = differenceInDays(new Date(movedTask.end_date), new Date(movedTask.start_date));
  const newEndDate = addDays(newStartDate, movedTaskDuration);
  
  updateDependentTasks(movedTask.id, newEndDate);
  
  return updates;
};

// Validate that a move doesn't create circular dependencies
const validateDependencyMove = (
  taskToMove: GanttTask,
  newStartDate: Date,
  allTasks: GanttTask[]
): { isValid: boolean; reason?: string } => {
  // Check if moving this task would create a circular dependency
  const visited = new Set<string>();
  
  const hasCircularDependency = (taskId: string, targetTaskId: string): boolean => {
    if (visited.has(taskId)) return false;
    visited.add(taskId);
    
    const task = allTasks.find(t => t.id === taskId);
    if (!task || !task.predecessors) return false;
    
    for (const predId of task.predecessors) {
      if (predId === targetTaskId) return true;
      if (hasCircularDependency(predId, targetTaskId)) return true;
    }
    
    return false;
  };
  
  // Check if any successor of the moved task would create a circular dependency
  const successors = allTasks.filter(task => 
    task.predecessors && task.predecessors.includes(taskToMove.id)
  );
  
  for (const successor of successors) {
    if (hasCircularDependency(successor.id, taskToMove.id)) {
      return {
        isValid: false,
        reason: `Moving this task would create a circular dependency with ${successor.title}`
      };
    }
  }
  
  return { isValid: true };
};

// Critical path calculation utility
const recalculateCriticalPath = (allTasks: GanttTask[]): string[] => {
  const criticalTasks: string[] = [];
  
  // Simple critical path detection - find the longest path through the project
  const findLongestPath = (taskId: string, visited: Set<string> = new Set()): number => {
    if (visited.has(taskId)) return 0; // Prevent infinite loops
    visited.add(taskId);
    
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return 0;
    
    const taskDuration = differenceInDays(new Date(task.end_date), new Date(task.start_date)) + 1;
    
    // Get all successors (tasks that depend on this task)
    const successors = allTasks.filter(t => 
      t.predecessors && t.predecessors.includes(taskId)
    );
    
    if (successors.length === 0) {
      return taskDuration; // Leaf task
    }
    
    // Find the longest path through successors
    const maxSuccessorPath = Math.max(
      ...successors.map(successor => findLongestPath(successor.id, new Set(visited)))
    );
    
    return taskDuration + maxSuccessorPath;
  };
  
  // Find tasks with no predecessors (start tasks)
  const startTasks = allTasks.filter(task => 
    !task.predecessors || task.predecessors.length === 0
  );
  
  let longestPathLength = 0;
  let criticalStartTask: string | null = null;
  
  // Find the start task that leads to the longest path
  startTasks.forEach(startTask => {
    const pathLength = findLongestPath(startTask.id);
    if (pathLength > longestPathLength) {
      longestPathLength = pathLength;
      criticalStartTask = startTask.id;
    }
  });
  
  // Trace the critical path
  if (criticalStartTask) {
    const traceCriticalPath = (taskId: string, visited: Set<string> = new Set()): string[] => {
      if (visited.has(taskId)) return [];
      visited.add(taskId);
      
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return [];
      
      criticalTasks.push(taskId);
      
      // Find the successor with the longest path
      const successors = allTasks.filter(t => 
        t.predecessors && t.predecessors.includes(taskId)
      );
      
      let longestSuccessor: string | null = null;
      let maxLength = 0;
      
      successors.forEach(successor => {
        const pathLength = findLongestPath(successor.id, new Set(visited));
        if (pathLength > maxLength) {
          maxLength = pathLength;
          longestSuccessor = successor.id;
        }
      });
      
      if (longestSuccessor) {
        return [taskId, ...traceCriticalPath(longestSuccessor, new Set(visited))];
      }
      
      return [taskId];
    };
    
    return traceCriticalPath(criticalStartTask);
  }
  
  return criticalTasks;
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
      isCritical: task.priority === 'critical' || task.title.toLowerCase().includes('critical'),
      resourceNames: task.assigned_to ? [task.assigned_to] : [],
      actualProgress: task.progress_percentage || 0,
      predecessors: task.dependencies || [],
      successors: [],
      floatDays: 0
    }));
  }, [tasks]);

  // Calculate timeline bounds with proper date handling
  const timelineBounds = useMemo(() => {
    if (timelineStart && timelineEnd) {
      return { start: timelineStart, end: timelineEnd };
    }

    if (processedTasks.length === 0) {
      const today = new Date();
      return {
        start: startOfMonth(today),
        end: endOfMonth(addDays(today, 90))
      };
    }

    // Parse dates safely
    const validTasks = processedTasks.filter(task => {
      const startDate = typeof task.start_date === 'string' ? parseISO(task.start_date) : new Date(task.start_date);
      const endDate = typeof task.end_date === 'string' ? parseISO(task.end_date) : new Date(task.end_date);
      return isValid(startDate) && isValid(endDate);
    });

    if (validTasks.length === 0) {
      const today = new Date();
      return {
        start: startOfMonth(today),
        end: endOfMonth(addDays(today, 90))
      };
    }

    const startDates = validTasks.map(t => {
      const date = typeof t.start_date === 'string' ? parseISO(t.start_date) : new Date(t.start_date);
      return date.getTime();
    });
    const endDates = validTasks.map(t => {
      const date = typeof t.end_date === 'string' ? parseISO(t.end_date) : new Date(t.end_date);
      return date.getTime();
    });

    const minDate = new Date(Math.min(...startDates));
    const maxDate = new Date(Math.max(...endDates));
    
    // Add padding
    return {
      start: startOfMonth(addDays(minDate, -7)),
      end: endOfMonth(addDays(maxDate, 14))
    };
  }, [processedTasks, timelineStart, timelineEnd]);

  // Generate timeline days
  const timelineDays = useMemo(() => {
    return eachDayOfInterval({
      start: timelineBounds.start,
      end: timelineBounds.end
    });
  }, [timelineBounds]);

  const totalTimelineWidth = timelineDays.length * GANTT_CONFIG.dayWidth;

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      // Clean up any remaining event listeners
      document.removeEventListener('mousemove', () => {});
      document.removeEventListener('mouseup', () => {});
    };
  }, []);

  // Handle task click
  const handleTaskClick = (task: GanttTask, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskId(task.id);
    onTaskClick?.(task);
  };

  // Handle task drag (horizontal - for date changes)
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
        
        // Validate the move doesn't create circular dependencies
        const validation = validateDependencyMove(task, newStartDate, processedTasks);
        
        if (!validation.isValid) {
          console.error('Invalid move:', validation.reason);
          // TODO: Show user feedback about invalid move
          return;
        }
        
        // Calculate cascade updates for dependent tasks
        const dependencyUpdates = calculateDependencyUpdates(task, newStartDate, processedTasks);
        
        console.log('Dependency cascade updates:', dependencyUpdates);
        
        // Apply the main task update
        onTaskUpdate?.(task.id, {
          start_date: newStartDate,
          end_date: newEndDate
        });
        
        // Apply cascade updates to dependent tasks
        dependencyUpdates.forEach(update => {
          console.log('Cascading update to task:', update.taskId, update.updates);
          onTaskUpdate?.(update.taskId, update.updates);
        });
        
        // Show user feedback about cascade updates
        if (dependencyUpdates.length > 0) {
          console.log(`✅ Smart Gantt: Updated ${dependencyUpdates.length} dependent tasks automatically`);
          // TODO: Show toast notification to user
        }
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

  // Render timeline header
  const renderTimelineHeader = () => {
    return (
      <div className="gantt-timeline-header" style={{ height: GANTT_CONFIG.timelineHeaderHeight }}>
        {/* Month header */}
        <div className="gantt-month-header" style={{ height: 40 }}>
          {Array.from(new Set(timelineDays.map(day => format(day, 'MMM yyyy')))).map(month => {
            const monthDays = timelineDays.filter(day => format(day, 'MMM yyyy') === month);
            const monthWidth = monthDays.length * GANTT_CONFIG.dayWidth;
            
            return (
              <div
                key={month}
                className="gantt-month-cell"
                style={{ width: monthWidth, minWidth: monthWidth }}
              >
                {month}
              </div>
            );
          })}
        </div>
        
        {/* Day header */}
        <div className="gantt-day-header" style={{ height: 40 }}>
          {timelineDays.map((day, index) => {
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            
            return (
              <div
                key={day.toISOString()}
                className={`gantt-day-cell ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
                style={{ width: GANTT_CONFIG.dayWidth, minWidth: GANTT_CONFIG.dayWidth }}
              >
                <div className="gantt-day-number">{format(day, 'd')}</div>
                <div className="gantt-day-name">{format(day, 'EEE')}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render individual task row
  const renderTaskRow = (task: GanttTask, index: number) => {
    const startDate = typeof task.start_date === 'string' ? parseISO(task.start_date) : new Date(task.start_date);
    const endDate = typeof task.end_date === 'string' ? parseISO(task.end_date) : new Date(task.end_date);
    
    if (!isValid(startDate) || !isValid(endDate)) {
      return null; // Skip invalid tasks
    }

    const taskStartPosition = differenceInDays(startDate, timelineBounds.start) * GANTT_CONFIG.dayWidth;
    const taskDuration = differenceInDays(endDate, startDate) + 1;
    const taskWidth = Math.max(taskDuration * GANTT_CONFIG.dayWidth, 20); // Minimum width

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
      <React.Fragment key={task.id}>
        {/* Drop indicator line */}
        {isDropTarget && dragState.dragTaskId !== task.id && (
          <div
            className="gantt-drop-indicator"
            style={{
              height: '3px',
              backgroundColor: '#3b82f6',
              position: 'absolute',
              left: 0,
              right: 0,
              top: index * GANTT_CONFIG.rowHeight - 1.5,
              zIndex: 1000,
              borderRadius: '2px',
              boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)'
            }}
          />
        )}
        
        <div
          data-task-id={task.id}
          data-task-row={index}
          className={`gantt-task-row ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
          style={{ height: GANTT_CONFIG.rowHeight }}
        >
          {/* Task Name Column - for vertical dragging */}
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

          {/* Task Timeline - for horizontal dragging */}
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
      </React.Fragment>
    );
  };

  return (
    <div className="custom-gantt-container" ref={containerRef}>
      {/* Header */}
      <div className="gantt-header">
        <div className="gantt-header-left" style={{ width: GANTT_CONFIG.taskNameWidth }}>
          <div className="gantt-header-title">
            <Settings className="w-5 h-5 mr-2" />
            <div>
              <h3 className="font-semibold">Construction Schedule</h3>
              <p className="text-sm text-gray-500">{processedTasks.length} tasks • {processedTasks.filter(t => t.isCritical).length} critical</p>
            </div>
          </div>
        </div>
        <div className="gantt-header-right" style={{ width: totalTimelineWidth }}>
          {renderTimelineHeader()}
        </div>
      </div>

      {/* Task Rows */}
      <div className="gantt-body" style={{ minHeight: processedTasks.length * GANTT_CONFIG.rowHeight }}>
        {processedTasks.length === 0 ? (
          <div className="gantt-empty-state">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Available</h3>
            <p className="text-gray-500">Add tasks to see them on the construction timeline.</p>
          </div>
        ) : (
          processedTasks.map((task, index) => renderTaskRow(task, index))
        )}
      </div>

      {/* Footer */}
      <div className="gantt-footer">
        <div className="gantt-stats">
          <span>Duration: {differenceInDays(timelineBounds.end, timelineBounds.start)} days</span>
          <span>Critical: {processedTasks.filter(t => t.isCritical).length}</span>
          <span>Completed: {processedTasks.filter(t => (t.progress_percentage || 0) >= 100).length}</span>
        </div>
        <div className="gantt-help">
          {readOnly ? 'Read-only view' : 'Click tasks for details • Drag to reschedule'}
        </div>
      </div>
    </div>
  );
} 