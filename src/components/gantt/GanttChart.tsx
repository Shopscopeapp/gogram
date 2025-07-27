import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Move,
  Link,
  AlertTriangle,
  Edit3,
  Clock
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format, addDays, startOfWeek, endOfWeek, differenceInDays, isSameDay, isToday, isWeekend } from 'date-fns';
import type { Task } from '../../types';

// Dependency line component
interface DependencyLinesProps {
  tasks: Task[];
  taskRows: { [taskId: string]: number };
  dayWidth: number;
  startDate: Date;
  rowHeight: number;
}

function DependencyLines({ tasks, taskRows, dayWidth, startDate, rowHeight }: DependencyLinesProps) {
  const lines = useMemo(() => {
    const dependencyLines: Array<{
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      path: string;
    }> = [];

    tasks.forEach((task) => {
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach((depId) => {
          const dependentTask = tasks.find(t => t.id === depId);
          if (!dependentTask) return;

          const dependentRow = taskRows[depId];
          const currentRow = taskRows[task.id];
          
          if (dependentRow === undefined || currentRow === undefined) return;

          // Calculate positions
          const depEndDays = differenceInDays(dependentTask.end_date, startDate);
          const taskStartDays = differenceInDays(task.start_date, startDate);
          
          const x1 = Math.max(0, depEndDays * dayWidth + dayWidth); // End of dependency task
          const y1 = dependentRow * rowHeight + rowHeight / 2 + 40; // Middle of dependency task row (40px offset for header)
          const x2 = Math.max(0, taskStartDays * dayWidth); // Start of current task
          const y2 = currentRow * rowHeight + rowHeight / 2 + 40; // Middle of current task row

          // Create curved path for better visualization
          const midX = x1 + (x2 - x1) * 0.5;
          const curveOffset = Math.abs(y2 - y1) * 0.3;
          const path = `M ${x1} ${y1} Q ${x1 + curveOffset} ${y1} ${midX} ${y1 + (y2 - y1) * 0.5} Q ${x2 - curveOffset} ${y2} ${x2} ${y2}`;

          dependencyLines.push({
            id: `${depId}-${task.id}`,
            x1,
            y1,
            x2,
            y2,
            path
          });
        });
      }
    });

    return dependencyLines;
  }, [tasks, taskRows, dayWidth, startDate, rowHeight]);

  if (lines.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0 0, 8 3, 0 6"
            fill="#6366f1"
          />
        </marker>
      </defs>
      {lines.map((line) => (
        <g key={line.id}>
          <path
            d={line.path}
            stroke="#6366f1"
            strokeWidth="2"
            fill="none"
            strokeDasharray="5,3"
            markerEnd="url(#arrowhead)"
            opacity="0.8"
            className="hover:opacity-100 transition-opacity"
          />
        </g>
      ))}
    </svg>
  );
}

interface TaskEditModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
}

function TaskEditModal({ task, isOpen, onClose, onSave }: TaskEditModalProps) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'pending',
  });

  React.useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
      });
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(task.id, formData);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Task</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Task Title</label>
            <input
              type="text"
              required
              className="input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <select
                className="input"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

interface GanttTaskProps {
  task: Task;
  startDate: Date;
  dayWidth: number;
  onTaskMove: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
  onTaskClick: (task: Task) => void;
}

function GanttTask({ task, startDate, dayWidth, onTaskMove, onTaskClick }: GanttTaskProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  // Calculate task position and width
  const taskStartDays = differenceInDays(task.start_date, startDate);
  const taskDuration = differenceInDays(task.end_date, task.start_date) + 1;
  const taskX = Math.max(0, taskStartDays * dayWidth);
  const taskWidth = Math.max(dayWidth * 0.5, taskDuration * dayWidth); // Minimum width for visibility

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-500';
      case 'in_progress': return 'bg-primary-500';
      case 'delayed': return 'bg-danger-500';
      case 'pending': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-4 border-l-red-600';
      case 'high': return 'border-l-4 border-l-orange-500';
      case 'medium': return 'border-l-4 border-l-yellow-500';
      case 'low': return 'border-l-4 border-l-green-500';
      default: return '';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, left: taskX, width: taskWidth }}
      className={`absolute h-8 rounded-lg shadow-sm cursor-pointer group hover:shadow-lg transition-all duration-200 ${getStatusColor(task.status)} ${getPriorityBorder(task.priority)} hover:scale-105 hover:z-10`}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onTaskClick(task);
      }}
    >
      {/* Progress bar inside task */}
      <div 
        className="absolute top-0 left-0 h-full bg-white bg-opacity-20 rounded-lg transition-all duration-300"
        style={{ width: `${task.progress_percentage}%` }}
      />
      
      <div className="h-full flex items-center justify-between px-3 text-white text-xs font-medium relative z-10">
        <div className="flex items-center space-x-1 min-w-0">
          {task.dependencies.length > 0 && (
            <Link className="w-3 h-3 flex-shrink-0 opacity-75" />
          )}
          <span className="truncate font-semibold">{task.title}</span>
        </div>
        <div className="flex items-center space-x-1 opacity-75 group-hover:opacity-100 transition-opacity">
          <span className="text-xs hidden sm:inline">{task.progress_percentage}%</span>
          <Edit3 className="w-3 h-3" />
        </div>
      </div>
      
      {/* Enhanced Task tooltip */}
      <div className="absolute top-full left-0 mt-2 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 shadow-xl min-w-max">
        <div className="font-semibold text-sm mb-1">{task.title}</div>
        <div className="space-y-1 text-gray-300">
          <div>📅 {format(task.start_date, 'MMM dd')} - {format(task.end_date, 'MMM dd')}</div>
          <div>⏱️ Duration: {taskDuration} days</div>
          <div>📊 Progress: {task.progress_percentage}%</div>
          <div>🎯 Status: <span className="capitalize">{task.status.replace('_', ' ')}</span></div>
          <div>⚡ Priority: <span className="capitalize">{task.priority}</span></div>
          <div>🏗️ Category: {task.category}</div>
          {task.dependencies.length > 0 && (
            <div>🔗 Dependencies: {task.dependencies.length}</div>
          )}
          {task.primary_supplier_id && (
            <div>🚚 Has supplier assigned</div>
          )}
          {task.requires_materials && (
            <div>📦 Requires materials</div>
          )}
        </div>
        {task.description && (
          <div className="mt-2 pt-2 border-t border-gray-700 text-gray-300 max-w-xs">
            {task.description}
          </div>
        )}
      </div>
    </div>
  );
}

interface GanttRowProps {
  task: Task;
  startDate: Date;
  dayWidth: number;
  onTaskMove: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
  onTaskClick: (task: Task) => void;
}

function GanttRow({ task, startDate, dayWidth, onTaskMove, onTaskClick }: GanttRowProps) {
  return (
    <div className="flex items-center border-b border-gray-100 hover:bg-gray-50 group">
      {/* Task Info Column */}
      <div className="w-80 px-4 py-3 flex-shrink-0 border-r border-gray-200">
        <div className="flex items-center space-x-3">
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: task.color }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <p className="font-medium text-gray-900 text-sm truncate">
                {task.title}
              </p>
              <button
                onClick={() => onTaskClick(task)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
              >
                <Edit3 className="w-3 h-3 text-gray-500" />
              </button>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
              <span>{task.category}</span>
              <span>•</span>
              <span className={`px-1 py-0.5 rounded text-xs ${
                task.priority === 'critical' ? 'bg-danger-100 text-danger-700' :
                task.priority === 'high' ? 'bg-warning-100 text-warning-700' :
                task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {task.priority}
              </span>
              {task.dependencies.length > 0 && (
                <>
                  <span>•</span>
                  <span title={`Depends on ${task.dependencies.length} task(s)`}>
                    <Link className="w-3 h-3 inline" />
                  </span>
                </>
              )}
              <span>•</span>
              <span>{format(task.start_date, 'MMM dd')} - {format(task.end_date, 'MMM dd')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Column */}
      <div className="flex-1 relative h-12">
        <GanttTask 
          task={task} 
          startDate={startDate}
          dayWidth={dayWidth}
          onTaskMove={onTaskMove}
          onTaskClick={onTaskClick}
        />
      </div>
    </div>
  );
}

interface GanttChartProps {
  tasks?: Task[];
  onTaskMove?: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
  readOnly?: boolean;
}

export default function GanttChart({ 
  tasks: propTasks, 
  onTaskMove: propOnTaskMove, 
  readOnly = false 
}: GanttChartProps = {}) {
  const { tasks: storeTasks, moveTask: storeMoveTask, updateTask } = useAppStore();
  
  // Use props if provided, otherwise use store
  const tasks = propTasks || storeTasks;
  const moveTask = propOnTaskMove || storeMoveTask;
  const [viewStartDate, setViewStartDate] = useState(startOfWeek(new Date()));
  const [zoomLevel, setZoomLevel] = useState(40); // pixels per day
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate timeline dates
  const timelineDays = viewMode === 'week' ? 14 : 30; // 2 weeks or 1 month
  const timelineEndDate = addDays(viewStartDate, timelineDays);
  const dates = Array.from({ length: timelineDays }, (_, i) => addDays(viewStartDate, i));

  // Sort tasks by start date
  const sortedTasks = useMemo(() => 
    [...tasks].sort((a, b) => a.start_date.getTime() - b.start_date.getTime()),
    [tasks]
  );

  // Create task row mapping for dependency lines
  const taskRows = useMemo(() => {
    const rows: { [taskId: string]: number } = {};
    sortedTasks.forEach((task, index) => {
      rows[task.id] = index;
    });
    return rows;
  }, [sortedTasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (readOnly) return; // No drag and drop in read-only mode
    
    const { active, delta } = event;
    
    if (!delta) return;

    const task = tasks.find(t => t.id === active.id);
    if (!task) return;

    // Calculate new dates based on drag distance
    const daysMoved = Math.round(delta.x / zoomLevel);
    if (daysMoved === 0) return; // No actual movement

    const newStartDate = addDays(task.start_date, daysMoved);
    const newEndDate = addDays(task.end_date, daysMoved);

    // Update task and dependencies
    moveTask(task.id, newStartDate, newEndDate);
    
    // Force immediate visual update
    setTimeout(() => {
      // Trigger a re-render by updating the component state
      setViewStartDate(prev => prev);
    }, 10);
  };

  const handleTimelineNavigation = (direction: 'prev' | 'next') => {
    const daysToMove = viewMode === 'week' ? 7 : 30;
    setViewStartDate(prev => 
      direction === 'next' 
        ? addDays(prev, daysToMove)
        : addDays(prev, -daysToMove)
    );
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevel(prev => {
      const newZoom = direction === 'in' ? prev + 10 : prev - 10;
      return Math.max(20, Math.min(100, newZoom));
    });
  };

  const handleTaskClick = (task: Task) => {
    if (readOnly) return; // No interaction in read-only mode
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskSave = (taskId: string, updates: Partial<Task>) => {
    if (readOnly) return; // No editing in read-only mode
    updateTask(taskId, updates);
  };

  const getDayHeaderClass = (date: Date) => {
    let classes = "text-center px-1 py-2 text-xs font-medium border-r border-gray-200";
    
    if (isToday(date)) {
      classes += " bg-primary-100 text-primary-800";
    } else if (isWeekend(date)) {
      classes += " bg-gray-100 text-gray-600";
    } else {
      classes += " bg-white text-gray-700";
    }
    
    return classes;
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      {/* Gantt Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <h3 className="font-semibold text-gray-900">Project Timeline</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{format(viewStartDate, 'MMM dd')} - {format(timelineEndDate, 'MMM dd, yyyy')}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-200 rounded p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              2 Weeks
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Month
            </button>
          </div>

          {/* Navigation */}
          <button
            onClick={() => handleTimelineNavigation('prev')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleTimelineNavigation('next')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center border-l pl-2 ml-2">
            <button
              onClick={() => handleZoom('out')}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs text-gray-600">{Math.round((zoomLevel / 40) * 100)}%</span>
            <button
              onClick={() => handleZoom('in')}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Gantt Content */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: 320 + (timelineDays * zoomLevel) }}>
          {/* Date Headers */}
          <div className="flex border-b border-gray-300">
            <div className="w-80 px-4 py-3 bg-gray-50 border-r border-gray-200 font-medium text-gray-900 text-sm">
              Tasks ({sortedTasks.length})
            </div>
            <div className="flex-1 flex">
              {dates.map((date, index) => (
                <div
                  key={index}
                  className={getDayHeaderClass(date)}
                  style={{ width: zoomLevel, minWidth: zoomLevel }}
                >
                  <div className="font-semibold">{format(date, 'dd')}</div>
                  <div className="text-xs opacity-75">{format(date, 'EEE')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedTasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="relative">
                {/* Grid Lines */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="flex">
                    <div className="w-80 border-r border-gray-200"></div>
                    <div className="flex-1 flex">
                      {dates.map((date, index) => (
                        <div
                          key={index}
                          className={`border-r border-gray-100 ${
                            isToday(date) ? 'bg-primary-50' : 
                            isWeekend(date) ? 'bg-gray-50' : ''
                          }`}
                          style={{ width: zoomLevel, minWidth: zoomLevel }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dependency Lines */}
                <DependencyLines
                  tasks={sortedTasks}
                  taskRows={taskRows}
                  dayWidth={zoomLevel}
                  startDate={viewStartDate}
                  rowHeight={48}
                />

                {/* Task Rows */}
                {sortedTasks.map((task) => (
                  <GanttRow 
                    key={task.id}
                    task={task} 
                    startDate={viewStartDate}
                    dayWidth={zoomLevel}
                    onTaskMove={moveTask}
                    onTaskClick={handleTaskClick}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Empty State */}
          {sortedTasks.length === 0 && (
            <div className="py-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tasks to display</p>
              <p className="text-sm text-gray-400 mt-1">Add tasks to see them in the timeline</p>
            </div>
          )}
        </div>
      </div>

      {/* Task Edit Modal */}
      <TaskEditModal
        task={selectedTask}
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
        }}
        onSave={handleTaskSave}
      />
    </div>
  );
} 