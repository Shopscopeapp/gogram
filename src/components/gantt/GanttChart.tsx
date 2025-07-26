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
  const taskWidth = taskDuration * dayWidth;

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
      className={`absolute h-8 rounded-md shadow-sm cursor-pointer group hover:shadow-md transition-all ${getStatusColor(task.status)} ${getPriorityBorder(task.priority)}`}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onTaskClick(task);
      }}
    >
      <div className="h-full flex items-center justify-between px-2 text-white text-xs font-medium">
        <div className="flex items-center space-x-1 min-w-0">
          {task.dependencies.length > 0 && (
            <Link className="w-3 h-3 flex-shrink-0" />
          )}
          <span className="truncate">{task.title}</span>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit3 className="w-3 h-3" />
          <Move className="w-3 h-3" />
        </div>
      </div>
      
      {/* Task tooltip */}
      <div className="absolute top-full left-0 mt-1 bg-gray-900 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
        <div><strong>{task.title}</strong></div>
        <div>Duration: {taskDuration} days</div>
        <div>Status: {task.status}</div>
        <div>Priority: {task.priority}</div>
        {task.description && <div className="mt-1 max-w-xs">{task.description}</div>}
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

export default function GanttChart() {
  const { tasks, moveTask, updateTask } = useAppStore();
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    
    if (!delta) return;

    const task = tasks.find(t => t.id === active.id);
    if (!task) return;

    // Calculate new dates based on drag distance
    const daysMoved = Math.round(delta.x / zoomLevel);
    const newStartDate = addDays(task.start_date, daysMoved);
    const newEndDate = addDays(task.end_date, daysMoved);

    // Update task and dependencies
    moveTask(task.id, newStartDate, newEndDate);
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
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskSave = (taskId: string, updates: Partial<Task>) => {
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