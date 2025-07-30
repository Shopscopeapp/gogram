import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Calendar, Clock, Settings, Smartphone, Monitor, List, BarChart3, Plus, AlertTriangle, Users, Wrench, DollarSign } from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, differenceInDays, parseISO, isValid, isWeekend, isSameDay } from 'date-fns';
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
  // Construction-specific properties
  earlyStart?: Date;
  earlyFinish?: Date;
  lateStart?: Date;
  lateFinish?: Date;
  totalFloat?: number;
  freeFloat?: number;
  criticalPath?: boolean;
  resourceConflicts?: string[];
  weatherImpact?: boolean;
  costImpact?: number;
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

  // Construction-specific utility functions
  const calculateWorkDays = (startDate: Date, endDate: Date, workDaysPerWeek: number = 5): number => {
    let workDays = 0;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      if (!isWeekend(currentDate)) {
        workDays++;
      }
      currentDate = addDays(currentDate, 1);
    }
    
    return workDays;
  };

  const calculateCriticalPath = (tasks: GanttTask[]): GanttTask[] => {
    // Forward pass - calculate early start and early finish
    const taskMap = new Map(tasks.map(task => [task.id, { ...task }]));
    
    // Find tasks with no predecessors (start tasks)
    const startTasks = tasks.filter(task => !task.predecessors || task.predecessors.length === 0);
    
    // Forward pass
    const calculateEarlyDates = (taskId: string, visited: Set<string> = new Set()): void => {
      if (visited.has(taskId)) return;
      visited.add(taskId);
      
      const task = taskMap.get(taskId);
      if (!task) return;
      
      // Calculate early start based on predecessors
      let earliestStart = new Date(task.start_date);
      if (task.predecessors && task.predecessors.length > 0) {
        const predecessorDates = task.predecessors
          .map(predId => taskMap.get(predId))
          .filter(Boolean)
          .map(pred => pred!.earlyFinish || pred!.end_date);
        
        if (predecessorDates.length > 0) {
          earliestStart = new Date(Math.max(...predecessorDates.map(d => d.getTime())));
          if (task.lag_days) {
            earliestStart = addDays(earliestStart, task.lag_days);
          }
        }
      }
      
      task.earlyStart = earliestStart;
      task.earlyFinish = addDays(earliestStart, task.planned_duration - 1);
      
      // Update successors
      if (task.successors) {
        task.successors.forEach(successorId => calculateEarlyDates(successorId, visited));
      }
    };
    
    // Calculate early dates for all start tasks
    startTasks.forEach(task => calculateEarlyDates(task.id));
    
    // Backward pass - calculate late start and late finish
    const endTasks = tasks.filter(task => !task.successors || task.successors.length === 0);
             const projectEndDate = new Date(Math.max(...endTasks.map(task => {
           const finishDate = task.earlyFinish || task.end_date;
           return finishDate ? finishDate.getTime() : new Date().getTime();
         })));
    
    const calculateLateDates = (taskId: string, visited: Set<string> = new Set()): void => {
      if (visited.has(taskId)) return;
      visited.add(taskId);
      
      const task = taskMap.get(taskId);
      if (!task) return;
      
      // Calculate late finish based on successors
      let latestFinish = projectEndDate;
      if (task.successors && task.successors.length > 0) {
        const successorDates = task.successors
          .map(succId => taskMap.get(succId))
          .filter(Boolean)
          .map(succ => succ!.lateStart || succ!.start_date);
        
        if (successorDates.length > 0) {
          latestFinish = new Date(Math.min(...successorDates.map(d => d.getTime())));
          if (task.lag_days) {
            latestFinish = addDays(latestFinish, -task.lag_days);
          }
        }
      }
      
      task.lateFinish = latestFinish;
      task.lateStart = addDays(latestFinish, -(task.planned_duration - 1));
      
      // Calculate float
      task.totalFloat = differenceInDays(task.lateFinish, task.earlyFinish || task.end_date);
      task.freeFloat = task.totalFloat;
      
      // Check if critical (zero float)
      task.criticalPath = task.totalFloat === 0;
      
      // Update predecessors
      if (task.predecessors) {
        task.predecessors.forEach(predId => calculateLateDates(predId, visited));
      }
    };
    
    // Calculate late dates for all end tasks
    endTasks.forEach(task => calculateLateDates(task.id));
    
    return Array.from(taskMap.values());
  };

  const adjustScheduleForDependencies = (tasks: GanttTask[]): GanttTask[] => {
    const taskMap = new Map(tasks.map(task => [task.id, { ...task }]));
    const updatedTasks: GanttTask[] = [];
    
    // Sort tasks by dependencies (topological sort)
    const visited = new Set<string>();
    const tempVisited = new Set<string>();
    
    const visit = (taskId: string): void => {
      if (tempVisited.has(taskId)) {
        throw new Error('Circular dependency detected');
      }
      if (visited.has(taskId)) return;
      
      tempVisited.add(taskId);
      const task = taskMap.get(taskId);
      if (!task) return;
      
      // Visit predecessors first
      if (task.predecessors) {
        task.predecessors.forEach(predId => visit(predId));
      }
      
      tempVisited.delete(taskId);
      visited.add(taskId);
      updatedTasks.push(task);
    };
    
    // Visit all tasks
    tasks.forEach(task => {
      if (!visited.has(task.id)) {
        visit(task.id);
      }
    });
    
    // Adjust start dates based on dependencies
    updatedTasks.forEach(task => {
      if (task.predecessors && task.predecessors.length > 0) {
        const latestPredecessorFinish = task.predecessors
          .map(predId => taskMap.get(predId))
          .filter(Boolean)
          .map(pred => pred!.end_date)
          .reduce((latest, date) => date > latest ? date : latest, new Date(0));
        
        const newStartDate = addDays(latestPredecessorFinish, task.lag_days || 0);
        if (newStartDate > task.start_date) {
          task.start_date = newStartDate;
          task.end_date = addDays(newStartDate, task.planned_duration - 1);
        }
      }
    });
    
    return updatedTasks;
  };

  const detectResourceConflicts = (tasks: GanttTask[]): Map<string, string[]> => {
    const conflicts = new Map<string, string[]>();
    
    tasks.forEach(task => {
      if (task.resource_names && task.resource_names.length > 0) {
        const overlappingTasks = tasks.filter(otherTask => {
          if (otherTask.id === task.id) return false;
          
          // Check if tasks overlap in time
          const taskStart = new Date(task.start_date);
          const taskEnd = new Date(task.end_date);
          const otherStart = new Date(otherTask.start_date);
          const otherEnd = new Date(otherTask.end_date);
          
          const timeOverlap = taskStart <= otherEnd && otherStart <= taskEnd;
          
          // Check if they share resources
          const resourceOverlap = task.resource_names!.some(resource => 
            otherTask.resource_names?.includes(resource)
          );
          
          return timeOverlap && resourceOverlap;
        });
        
        if (overlappingTasks.length > 0) {
          conflicts.set(task.id, overlappingTasks.map(t => t.id));
        }
      }
    });
    
    return conflicts;
  };

  // New function to handle dependency-based scheduling when a task is moved
  const handleDependencyBasedScheduling = (movedTask: GanttTask, newStartDate: Date, newEndDate: Date) => {
    if (!onTaskUpdate) return;

    const taskMap = new Map(tasks.map(task => [task.id, { ...task }]));
    const updatedTasks = new Set<string>();
    const updates: Array<{ taskId: string; updates: Partial<Task> }> = [];

    // Update the moved task first
    updates.push({
      taskId: movedTask.id,
      updates: {
        start_date: newStartDate,
        end_date: newEndDate
      }
    });
    updatedTasks.add(movedTask.id);

    // Find all tasks that depend on the moved task (successors)
    const findSuccessors = (taskId: string): string[] => {
      const successors: string[] = [];
      tasks.forEach(task => {
        if (task.predecessors?.includes(taskId)) {
          successors.push(task.id);
        }
      });
      return successors;
    };

    // Recursively update dependent tasks
    const updateDependentTasks = (taskId: string) => {
      const successors = findSuccessors(taskId);
      
      successors.forEach(successorId => {
        if (updatedTasks.has(successorId)) return; // Avoid circular updates
        
        const successor = taskMap.get(successorId);
        if (!successor) return;

        // Calculate new start date based on the moved task's end date
        const movedTaskEnd = taskMap.get(taskId)?.end_date;
        if (!movedTaskEnd) return;

        const newSuccessorStart = addDays(movedTaskEnd, successor.lag_days || 0);
        const duration = differenceInDays(successor.end_date, successor.start_date);
        const newSuccessorEnd = addDays(newSuccessorStart, duration);

        // Only update if the new start date is later than current start date
        if (newSuccessorStart > successor.start_date) {
          updates.push({
            taskId: successorId,
            updates: {
              start_date: newSuccessorStart,
              end_date: newSuccessorEnd
            }
          });
          updatedTasks.add(successorId);
          
          // Update the task map for subsequent calculations
          taskMap.set(successorId, {
            ...successor,
            start_date: newSuccessorStart,
            end_date: newSuccessorEnd
          });

          // Recursively update this successor's dependents
          updateDependentTasks(successorId);
        }
      });
    };

    // Start the cascade from the moved task
    updateDependentTasks(movedTask.id);

    // Apply all updates
    updates.forEach(({ taskId, updates }) => {
      onTaskUpdate(taskId, updates);
    });

    return updates.length > 1; // Return true if other tasks were affected
  };

  // Process tasks with hierarchical grouping and construction-specific enhancements
  const processedTasks = useMemo(() => {
    // Group tasks by category
    const taskGroups = new Map<string, { category: string; tasks: Task[] }>();
    
    tasks.forEach(task => {
      const category = task.category || 'Uncategorized';
      
      if (!taskGroups.has(category)) {
        taskGroups.set(category, { category, tasks: [] });
      }
      taskGroups.get(category)!.tasks.push(task);
    });

    // Create hierarchical structure with group headers and tasks
    const hierarchicalTasks: GanttTask[] = [];
    
    taskGroups.forEach((group, category) => {
      // Add group header
      const groupHeader: GanttTask = {
        id: `group-${category}`,
        project_id: tasks[0]?.project_id || '',
        title: group.category,
        description: '',
        category: 'group',
        location: '',
        status: 'pending',
        priority: 'medium',
        assigned_to: undefined,
        start_date: new Date(),
        end_date: new Date(),
        actual_start_date: undefined,
        actual_end_date: undefined,
        planned_duration: 0,
        actual_duration: undefined,
        progress_percentage: 0,
        color: '#6b7280',
        dependencies: [],
        notes: '',
        attachments: [],
        created_by: undefined,
        created_at: new Date(),
        updated_at: new Date(),
        // GanttTask specific properties
        level: 0,
        hasChildren: true,
        isExpanded: true,
        isCritical: false,
        resourceNames: [],
        actualProgress: 0,
        predecessors: [],
        successors: [],
        floatDays: 0,
        earlyStart: undefined,
        earlyFinish: undefined,
        lateStart: undefined,
        lateFinish: undefined,
        totalFloat: 0,
        freeFloat: 0,
        criticalPath: false,
        resourceConflicts: [],
        weatherImpact: false,
        costImpact: 0
      };
      
      hierarchicalTasks.push(groupHeader);
      
      // Add tasks under this group
      group.tasks.forEach(task => {
        const enhancedTask: GanttTask = {
      ...task,
          level: 1,
      hasChildren: false,
      isExpanded: true,
      isCritical: task.priority === 'critical' || task.title?.toLowerCase().includes('critical'),
          resourceNames: task.resource_names || [],
      actualProgress: task.progress_percentage || 0,
          predecessors: task.predecessors || task.dependencies || [],
          successors: task.successors || [],
          floatDays: task.float_days || 0,
          earlyStart: undefined,
          earlyFinish: undefined,
          lateStart: undefined,
          lateFinish: undefined,
          totalFloat: 0,
          freeFloat: 0,
          criticalPath: false,
          resourceConflicts: [],
          weatherImpact: false,
          costImpact: 0
        };
        
        hierarchicalTasks.push(enhancedTask);
      });
    });

    // Apply construction-specific enhancements
    const enhancedTasks = hierarchicalTasks.map(task => ({
      ...task,
      successors: task.successors || [],
      floatDays: task.float_days || 0,
      workHoursPerDay: task.work_hours_per_day || 8,
      workDaysPerWeek: task.work_days_per_week || 5,
      weatherDependent: task.weather_dependent || false,
      costPerDay: task.cost_per_day || 0
    }));

    // Calculate critical path and adjust schedule
    const criticalPathTasks = calculateCriticalPath(enhancedTasks);
    const adjustedTasks = adjustScheduleForDependencies(criticalPathTasks);
    
    // Detect resource conflicts
    const resourceConflicts = detectResourceConflicts(adjustedTasks);
    
    // Add conflict information to tasks
    return adjustedTasks.map(task => ({
      ...task,
      resourceConflicts: resourceConflicts.get(task.id) || [],
      weatherImpact: task.weather_dependent && isWeekend(new Date()),
      costImpact: (task.cost_per_day || 0) * task.planned_duration
    }));
  }, [tasks]);

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
        // Visual feedback only - always show visual feedback during drag
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
        // Use task's original start date if drag state is not available
        const originalStartDate = dragState.dragStartDate || task.start_date;
        
        if (isValid(originalStartDate)) {
          const newStartDate = addDays(originalStartDate, daysDelta);
        const duration = differenceInDays(task.end_date, task.start_date);
        const newEndDate = addDays(newStartDate, duration);
        
          // Validate that the calculated dates are valid
          if (isValid(newStartDate) && isValid(newEndDate)) {
            // Use dependency-based scheduling to automatically adjust dependent tasks
            const tasksAffected = handleDependencyBasedScheduling(task, newStartDate, newEndDate);
            
            // Show feedback if multiple tasks were affected
            if (tasksAffected) {
              // You could add a toast notification here
              console.log('Dependent tasks automatically adjusted');
            }
          }
        }
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
    // Check if this is a group header
    const isGroupHeader = task.category === 'group';
    
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

    const getCriticalPathClass = (task: GanttTask) => {
      if (task.criticalPath) return 'border-2 border-red-600 shadow-lg';
      if (task.totalFloat && task.totalFloat <= 2) return 'border-2 border-orange-500 shadow-md';
      return '';
    };

    const getResourceConflictClass = (task: GanttTask) => {
      if (task.resourceConflicts && task.resourceConflicts.length > 0) {
        return 'bg-red-100 border-red-300';
      }
      return '';
    };

    const statusClass = getStatusClass(task.status);
    const criticalClass = task.isCritical ? 'critical' : '';
    const criticalPathClass = getCriticalPathClass(task);
    const resourceConflictClass = getResourceConflictClass(task);

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
          className={`gantt-task-name-cell ${isGroupHeader ? 'group-header' : ''}`}
          onClick={() => !isGroupHeader && onTaskClick?.(task)}
          style={{ 
            width: isMobile ? '100%' : GANTT_CONFIG.taskNameWidth,
            cursor: isGroupHeader ? 'default' : 'pointer',
            paddingLeft: isGroupHeader ? '16px' : `${16 + task.level * 20}px`
          }}
        >
          {!isGroupHeader && (
          <div
            className="gantt-drag-handle"
            onMouseDown={(e) => !isMobile && handleTaskDragStart(task, e, 'vertical')}
            onTouchStart={(e) => isMobile && handleTaskDragStart(task, e, 'vertical')}
          >
            ⋮⋮
          </div>
          )}
          <div className="gantt-task-info">
            <div className={`gantt-task-name ${isGroupHeader ? 'font-bold text-lg' : ''}`}>
              {isGroupHeader ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: task.color }}></div>
                  {task.title}
                </div>
              ) : (
                <>
              {task.title}
              {task.isCritical && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                  Critical
                </span>
                  )}
                </>
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
              {task.criticalPath && (
                <span className="flex items-center text-red-600">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Critical Path
                </span>
              )}
              {task.totalFloat !== undefined && task.totalFloat > 0 && (
                <span className="flex items-center text-orange-600">
                  <Clock className="w-3 h-3 mr-1" />
                  Float: {task.totalFloat}d
                </span>
              )}
              {task.resource_names && task.resource_names.length > 0 && (
                <span className="flex items-center text-blue-600">
                  <Users className="w-3 h-3 mr-1" />
                  {task.resource_names.join(', ')}
                </span>
              )}
              {task.costImpact && task.costImpact > 0 && (
                <span className="flex items-center text-green-600">
                  <DollarSign className="w-3 h-3 mr-1" />
                  ${task.costImpact.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Task Timeline - Hidden on mobile in list mode */}
        {(!isMobile || mobileView === 'timeline') && (
          <div 
            className="gantt-task-timeline"
            style={{ height: isMobile ? '60px' : GANTT_CONFIG.rowHeight }}
          >
            {/* Dependency Lines */}
            {showDependencies && task.predecessors && task.predecessors.length > 0 && (
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 10 }}
              >
                {task.predecessors.map((predId, idx) => {
                  const predTask = processedTasks.find(t => t.id === predId);
                  if (!predTask) return null;
                  
                  const predEnd = new Date(predTask.end_date);
                  const predEndOffset = differenceInDays(predEnd, timelineBounds.start) * GANTT_CONFIG.dayWidth;
                  const taskStartOffset = startOffset;
                  
                  return (
                    <g key={`${task.id}-${predId}-${idx}`}>
                      <line
                        x1={predEndOffset + GANTT_CONFIG.dayWidth}
                        y1={index * GANTT_CONFIG.rowHeight + GANTT_CONFIG.rowHeight / 2}
                        x2={taskStartOffset}
                        y2={index * GANTT_CONFIG.rowHeight + GANTT_CONFIG.rowHeight / 2}
                        stroke={predTask.criticalPath ? "#dc2626" : "#6b7280"}
                        strokeWidth="2"
                        strokeDasharray={predTask.criticalPath ? "none" : "5,5"}
                        markerEnd="url(#arrowhead)"
                      />
                    </g>
                  );
                })}
              </svg>
            )}
            {!isGroupHeader && (
              <div
                className={`gantt-task-bar ${statusClass} ${criticalClass} ${criticalPathClass} ${resourceConflictClass} ${
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
                  {task.criticalPath && (
                    <span className="ml-1 text-xs bg-red-600 text-white px-1 rounded">
                      CP
                    </span>
                  )}
                  {task.resourceConflicts && task.resourceConflicts.length > 0 && (
                    <span className="ml-1 text-xs bg-red-500 text-white px-1 rounded">
                      RC
                    </span>
                  )}
                  {task.weatherImpact && (
                    <span className="ml-1 text-xs bg-blue-500 text-white px-1 rounded">
                      W
                    </span>
                  )}
              </span>
            </div>
            )}
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
      {/* SVG Definitions for Dependency Arrows */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#6b7280"
            />
          </marker>
        </defs>
      </svg>
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

      {/* Construction Summary Panel */}
      {!isMobile && (
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-gray-700">
                Critical Path: {processedTasks.filter(t => t.criticalPath).length} tasks
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700">
                Resource Conflicts: {processedTasks.filter(t => t.resourceConflicts && t.resourceConflicts.length > 0).length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-orange-600" />
              <span className="text-gray-700">
                Total Float: {processedTasks.reduce((sum, t) => sum + (t.totalFloat || 0), 0)} days
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-gray-700">
                Total Cost: ${processedTasks.reduce((sum, t) => sum + (t.costImpact || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

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