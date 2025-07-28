import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, User, Calendar, Clock } from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, differenceInDays } from 'date-fns';
import type { Task } from '../../types';
import { safeDateFormat } from '../../utils/dateHelpers';
import './CustomGantt.css';

interface CustomGanttChartProps {
  tasks: Task[];
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick?: (task: Task) => void;
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
  // Construction-specific properties
  isCritical?: boolean;
  resourceNames?: string[];
  actualProgress?: number;
  predecessors?: string[];
  successors?: string[];
  floatDays?: number;
}

const GANTT_CONFIG = {
  rowHeight: 80,          // Much larger for construction visibility
  taskBarHeight: 48,      // Bigger task bars for better interaction
  timelineHeaderHeight: 120, // More space for timeline headers
  taskNameWidth: 400,     // Wider for detailed construction task names
  dayWidth: 45,           // Better day visibility
  minChartHeight: 600,    // Minimum chart height
  colors: {
    primary: '#2563eb',     // Blue for main tasks
    secondary: '#059669',   // Green for subtasks  
    tertiary: '#7c3aed',    // Purple for milestones
    completed: '#10b981',   // Green for completed
    overdue: '#ef4444',     // Red for overdue
    critical: '#dc2626',    // Red for critical path
    dependency: '#6b7280',  // Gray for dependency lines
    background: '#f8fafc',
    grid: '#e2e8f0',
    text: '#334155',
    textMuted: '#64748b'
  },
  construction: {
    showResources: true,
    showProgress: true,
    showCriticalPath: true,
    enableDragDrop: true,
    showDependencies: true
  }
};

export default function CustomGanttChart({
  tasks,
  onTaskUpdate,
  onTaskClick,
  readOnly = false,
  showDependencies = true,
  timelineStart,
  timelineEnd
}: CustomGanttChartProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const tasksRef = useRef<HTMLDivElement>(null);

  // Helper functions for construction features - moved above useMemo to fix hoisting
  const calculateCriticalPath = (task: Task, allTasks: Task[]): boolean => {
    // Simplified critical path detection - tasks with no float time
    const taskDuration = differenceInDays(new Date(task.end_date), new Date(task.start_date));
    const projectEnd = Math.max(...allTasks.map(t => new Date(t.end_date).getTime()));
    const taskEnd = new Date(task.end_date).getTime();
    
    // If task ends close to project end and has dependencies, likely critical
    return (projectEnd - taskEnd) <= (7 * 24 * 60 * 60 * 1000) && (task.dependencies?.length || 0) > 0;
  };

  const getResourceNames = (task: Task): string[] => {
    // Extract resource names from assigned_to or other fields
    const resources: string[] = [];
    if (task.assigned_to) {
      resources.push(task.assigned_to);
    }
    // Add more resource extraction logic as needed
    return resources;
  };

  const getTaskSuccessors = (taskId: string, allTasks: Task[]): string[] => {
    return allTasks
      .filter(task => task.dependencies?.includes(taskId))
      .map(task => task.id);
  };

  const calculateFloatDays = (task: Task, allTasks: Task[]): number => {
    // Simplified float calculation - in real implementation this would be more complex
    const successors = getTaskSuccessors(task.id, allTasks);
    if (successors.length === 0) return 0; // No successors, likely critical
    
    // Calculate based on successor start dates
    const taskEnd = new Date(task.end_date);
    const earliestSuccessorStart = Math.min(
      ...successors.map(id => {
        const successor = allTasks.find(t => t.id === id);
        return successor ? new Date(successor.start_date).getTime() : Infinity;
      })
    );
    
    if (earliestSuccessorStart === Infinity) return 0;
    
    const floatMs = earliestSuccessorStart - taskEnd.getTime();
    return Math.max(0, Math.floor(floatMs / (24 * 60 * 60 * 1000)));
  };

  // Process tasks for construction project management
  const processConstructionTasks = useMemo(() => {
    const processedTasks: GanttTask[] = tasks.map(task => ({
      ...task,
      level: 0,
      isExpanded: true,
      hasChildren: false,
      children: [],
      // Construction-specific calculations
      isCritical: calculateCriticalPath(task, tasks),
      resourceNames: getResourceNames(task),
      actualProgress: task.progress_percentage || 0,
      predecessors: task.dependencies || [],
      successors: getTaskSuccessors(task.id, tasks),
      floatDays: calculateFloatDays(task, tasks)
    }));

    return processedTasks.sort((a, b) => {
      // Critical path tasks first, then by start date
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    });
  }, [tasks]);

  // Build task hierarchy
  const hierarchicalTasks = processConstructionTasks;

  // Calculate timeline bounds
  const timelineBounds = useMemo(() => {
    if (timelineStart && timelineEnd) {
      return { start: timelineStart, end: timelineEnd };
    }

    if (tasks.length === 0) {
      const today = new Date();
      return {
        start: startOfMonth(today),
        end: endOfMonth(addDays(today, 90))
      };
    }

    let minDate = new Date(Math.min(...tasks.map(t => new Date(t.start_date).getTime())));
    let maxDate = new Date(Math.max(...tasks.map(t => new Date(t.end_date).getTime())));
    
    // Add padding
    minDate = startOfMonth(addDays(minDate, -30));
    maxDate = endOfMonth(addDays(maxDate, 30));

    return { start: minDate, end: maxDate };
  }, [tasks, timelineStart, timelineEnd]);

  // Generate timeline days
  const timelineDays = useMemo(() => {
    return eachDayOfInterval({
      start: timelineBounds.start,
      end: timelineBounds.end
    });
  }, [timelineBounds]);

  const totalWidth = timelineDays.length * GANTT_CONFIG.dayWidth;

  // Toggle task expansion
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Get task bar style
  const getTaskBarStyle = (task: GanttTask) => {
    const startDate = new Date(task.start_date);
    const endDate = new Date(task.end_date);
    
    const startOffset = differenceInDays(startDate, timelineBounds.start) * GANTT_CONFIG.dayWidth;
    const width = differenceInDays(endDate, startDate) * GANTT_CONFIG.dayWidth;
    
    // Determine color based on task type and status
    let backgroundColor = GANTT_CONFIG.colors.primary;
    if (task.level > 0) {
      backgroundColor = GANTT_CONFIG.colors.secondary;
    }
    if (task.progress === 100) {
      backgroundColor = GANTT_CONFIG.colors.completed;
    }
    if (new Date(task.end_date) < new Date() && task.progress < 100) {
      backgroundColor = GANTT_CONFIG.colors.overdue;
    }

    return {
      left: startOffset,
      width: Math.max(width, 10), // Minimum width
      backgroundColor,
      progress: task.progress || 0
    };
  };

  // Handle task drag
  const handleTaskDragStart = (taskId: string) => {
    if (readOnly) return;
    setIsDragging(true);
    setDragTaskId(taskId);
  };

  const handleTaskDragEnd = () => {
    setIsDragging(false);
    setDragTaskId(null);
  };

  // Render timeline header
  const renderTimelineHeader = () => {
    const months = Array.from(new Set(timelineDays.map(day => format(day, 'yyyy-MM'))));
    
    return (
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        {/* Month header */}
        <div className="flex h-10 bg-gray-50">
          <div className="w-80 border-r border-gray-200 flex items-center px-4 font-semibold text-gray-700">
            Task Name
          </div>
          <div className="flex-1 flex">
            {months.map(month => {
              const monthDays = timelineDays.filter(day => format(day, 'yyyy-MM') === month);
              const monthWidth = monthDays.length * GANTT_CONFIG.dayWidth;
              
              return (
                <div
                  key={month}
                  className="border-r border-gray-200 flex items-center justify-center font-medium text-sm text-gray-600"
                  style={{ width: monthWidth, minWidth: monthWidth }}
                >
                  {format(new Date(month), 'MMM yyyy')}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Week/Day header */}
        <div className="flex h-10">
          <div className="w-80 border-r border-gray-200 flex items-center px-4 text-sm text-gray-500">
            Progress
          </div>
          <div className="flex-1 flex">
            {timelineDays.map((day, index) => (
              <div
                key={day.toISOString()}
                className={`border-r border-gray-100 flex items-center justify-center text-xs ${
                  isSameMonth(day, new Date()) ? 'bg-blue-50' : ''
                }`}
                style={{ width: GANTT_CONFIG.dayWidth, minWidth: GANTT_CONFIG.dayWidth }}
              >
                <div className="text-center">
                  <div className="font-medium">{format(day, 'd')}</div>
                  <div className="text-gray-400">{format(day, 'E')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render individual task row with construction features
  const renderTaskRow = (task: GanttTask, index: number) => {
    const taskStartPosition = differenceInDays(new Date(task.start_date), timelineStart) * GANTT_CONFIG.dayWidth;
    const taskDuration = differenceInDays(new Date(task.end_date), new Date(task.start_date)) + 1;
    const taskWidth = taskDuration * GANTT_CONFIG.dayWidth;

    const getTaskColor = () => {
      if (task.isCritical) return GANTT_CONFIG.colors.critical;
      if (task.status === 'completed') return GANTT_CONFIG.colors.completed;
      if (new Date(task.end_date) < new Date() && task.status !== 'completed') {
        return GANTT_CONFIG.colors.overdue;
      }
      return task.color || GANTT_CONFIG.colors.primary;
    };

    const progressWidth = ((task.actualProgress || task.progress_percentage || 0) / 100) * taskWidth;

    return (
      <div
        key={task.id}
        className="gantt-task-row"
        style={{ height: GANTT_CONFIG.rowHeight }}
        onClick={() => onTaskClick?.(task)}
      >
        {/* Task Name Column */}
        <div 
          className="gantt-task-name"
          style={{ 
            width: GANTT_CONFIG.taskNameWidth,
            minHeight: GANTT_CONFIG.rowHeight,
            padding: '12px 16px'
          }}
        >
          <div className="flex items-center gap-3">
            {task.hasChildren && (
              <button className="w-4 h-4 flex items-center justify-center">
                {task.isExpanded ? 
                  <ChevronDown className="w-3 h-3" /> : 
                  <ChevronRight className="w-3 h-3" />
                }
              </button>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate">
                {task.title}
              </div>
              
              {/* Construction-specific details */}
              <div className="text-xs text-gray-500 mt-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>{safeDateFormat(task.start_date, 'MMM dd')} - {safeDateFormat(task.end_date, 'MMM dd')}</span>
                  {task.floatDays !== undefined && task.floatDays > 0 && (
                    <span className="bg-yellow-100 text-yellow-800 px-1 rounded text-xs">
                      {task.floatDays}d float
                    </span>
                  )}
                </div>
                
                {task.resourceNames && task.resourceNames.length > 0 && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="truncate">
                      {task.resourceNames.join(', ')}
                    </span>
                  </div>
                )}
                
                {task.isCritical && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-red-600" />
                    <span className="text-red-600 font-medium">Critical Path</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Task Bar in Timeline */}
        <div className="gantt-timeline-content flex-1 relative">
          <div
            className="gantt-task-bar"
            style={{
              position: 'absolute',
              left: taskStartPosition,
              width: taskWidth,
              height: GANTT_CONFIG.taskBarHeight,
              top: (GANTT_CONFIG.rowHeight - GANTT_CONFIG.taskBarHeight) / 2,
              backgroundColor: getTaskColor(),
              border: task.isCritical ? '2px solid #dc2626' : '1px solid rgba(0,0,0,0.1)',
              borderRadius: '6px',
              boxShadow: task.isCritical ? '0 2px 8px rgba(220, 38, 38, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
              cursor: readOnly ? 'default' : 'move',
              zIndex: task.isCritical ? 20 : 10
            }}
          >
            {/* Progress bar */}
            {progressWidth > 0 && (
              <div
                className="gantt-task-progress"
                style={{
                  width: progressWidth,
                  height: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px 0 0 4px'
                }}
              />
            )}
            
            {/* Task label */}
            <div className="gantt-task-label flex items-center justify-center h-full px-2">
              <span className="text-white font-medium text-sm truncate">
                {task.title}
              </span>
              {task.actualProgress !== undefined && (
                <span className="ml-2 text-white text-xs">
                  {task.actualProgress}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="custom-gantt-container" style={{ minHeight: GANTT_CONFIG.minChartHeight }}>
      {/* Header */}
      <div className="gantt-header flex border-b-2 border-gray-200 bg-white sticky top-0 z-50">
        <div 
          className="gantt-task-names-header bg-gray-50 border-r-2 border-gray-300 flex items-center px-4 font-semibold text-gray-700"
          style={{ width: GANTT_CONFIG.taskNameWidth, minHeight: GANTT_CONFIG.timelineHeaderHeight }}
        >
          <div>
            <div className="text-lg font-semibold">Construction Tasks</div>
            <div className="text-sm text-gray-500 mt-1">
              {hierarchicalTasks.length} tasks • Critical Path: {hierarchicalTasks.filter(t => t.isCritical).length}
            </div>
          </div>
        </div>
        
        <div className="gantt-timeline-header flex-1 overflow-x-auto">
          {renderTimelineHeader()}
        </div>
      </div>

      {/* Task Rows */}
      <div className="gantt-body bg-white" style={{ minHeight: hierarchicalTasks.length * GANTT_CONFIG.rowHeight }}>
        {hierarchicalTasks.map((task, index) => renderTaskRow(task, index))}
        
        {/* Empty state for construction projects */}
        {hierarchicalTasks.length === 0 && (
          <div className="flex items-center justify-center p-16 text-center bg-gray-50">
            <div>
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Construction Tasks</h3>
              <p className="text-gray-500 mb-4">Add your first construction task to start building your project timeline.</p>
              <button 
                onClick={() => {/* Add task handler */}}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Task
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Construction Project Summary */}
      <div className="gantt-footer bg-gray-50 border-t-2 border-gray-200 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-6">
            <span>Project Duration: {differenceInDays(timelineEnd, timelineStart)} days</span>
            <span>Critical Tasks: {hierarchicalTasks.filter(t => t.isCritical).length}</span>
            <span>Completed: {hierarchicalTasks.filter(t => t.status === 'completed').length}</span>
          </div>
          <div className="text-xs">
            Drag tasks to reschedule • Click for details • Red = Critical Path
          </div>
        </div>
      </div>
    </div>
  );
} 