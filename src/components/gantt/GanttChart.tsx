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
  AlertTriangle
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format, addDays, startOfWeek, endOfWeek, differenceInDays, isSameDay } from 'date-fns';
import type { Task } from '../../types';

interface GanttTaskProps {
  task: Task;
  startDate: Date;
  dayWidth: number;
  onTaskMove: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
}

function GanttTask({ task, startDate, dayWidth, onTaskMove }: GanttTaskProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: dndIsDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Calculate task position and width
  const taskStartDays = differenceInDays(task.start_date, startDate);
  const taskDuration = differenceInDays(task.end_date, task.start_date) + 1;
  const taskX = Math.max(0, taskStartDays * dayWidth);
  const taskWidth = taskDuration * dayWidth;

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative h-8 mb-2"
      {...attributes}
    >
      {/* Task Bar */}
      <motion.div
        className={`absolute rounded-lg shadow-sm border-2 cursor-move transition-all duration-200 ${
          isDragging || dndIsDragging
            ? 'shadow-lg scale-105 z-10'
            : 'hover:shadow-md'
        }`}
        style={{
          left: `${taskX}px`,
          width: `${Math.max(taskWidth, 60)}px`,
          backgroundColor: task.color || '#3b82f6',
          borderColor: task.status === 'delayed' ? '#ef4444' : 
                      task.status === 'completed' ? '#22c55e' :
                      task.status === 'in_progress' ? '#f59e0b' : '#6b7280',
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        {...listeners}
      >
        <div className="h-full flex items-center px-2 text-white text-xs font-medium">
          <div className="flex items-center space-x-1">
            <Move className="w-3 h-3 opacity-75" />
            <span className="truncate">
              {task.title.length > 15 ? task.title.substring(0, 15) + '...' : task.title}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Progress Bar for In-Progress Tasks */}
      {task.status === 'in_progress' && (
        <div
          className="absolute top-6 bg-warning-200 rounded-full h-1"
          style={{
            left: `${taskX}px`,
            width: `${Math.max(taskWidth, 60)}px`,
          }}
        >
          <div 
            className="bg-warning-600 h-1 rounded-full transition-all duration-300"
            style={{ width: '60%' }}
          />
        </div>
      )}

      {/* Dependency Indicators */}
      {task.dependencies.length > 0 && (
        <div 
          className="absolute -left-2 top-1/2 transform -translate-y-1/2"
          title={`Depends on ${task.dependencies.length} task(s)`}
        >
          <Link className="w-4 h-4 text-gray-400" />
        </div>
      )}
    </div>
  );
}

interface GanttRowProps {
  task: Task;
  startDate: Date;
  dayWidth: number;
  onTaskMove: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
}

function GanttRow({ task, startDate, dayWidth, onTaskMove }: GanttRowProps) {
  return (
    <div className="flex items-center border-b border-gray-100 py-2">
      {/* Task Info Column */}
      <div className="w-80 px-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: task.color }}
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 text-sm truncate">
              {task.title}
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{task.category}</span>
              <span>•</span>
              <span className={`px-1 py-0.5 rounded text-xs ${
                task.priority === 'critical' ? 'bg-danger-100 text-danger-700' :
                task.priority === 'high' ? 'bg-warning-100 text-warning-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {task.priority}
              </span>
              {task.dependencies.length > 0 && (
                <>
                  <span>•</span>
                  <span title={`Depends on ${task.dependencies.length} task(s)`}>
                    <AlertTriangle className="w-3 h-3 inline" />
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Column */}
      <div className="flex-1 relative">
        <GanttTask 
          task={task} 
          startDate={startDate}
          dayWidth={dayWidth}
          onTaskMove={onTaskMove}
        />
      </div>
    </div>
  );
}

export default function GanttChart() {
  const { tasks, moveTask } = useAppStore();
  const [viewStartDate, setViewStartDate] = useState(startOfWeek(new Date()));
  const [zoomLevel, setZoomLevel] = useState(40); // pixels per day
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

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

  const handleTaskMove = (taskId: string, newStartDate: Date, newEndDate: Date) => {
    moveTask(taskId, newStartDate, newEndDate);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          {/* Timeline Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleTimelineNavigation('prev')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="text-sm font-medium text-gray-900 min-w-[120px] text-center">
              {format(viewStartDate, 'MMM dd')} - {format(timelineEndDate, 'MMM dd')}
            </div>
            <button
              onClick={() => handleTimelineNavigation('next')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              2 Weeks
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <button
            onClick={() => handleZoom('out')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-sm text-gray-600 min-w-[60px] text-center">
            {Math.round((zoomLevel / 40) * 100)}%
          </div>
          <button
            onClick={() => handleZoom('in')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5 text-gray-600" />
          </button>

          <div className="border-l border-gray-300 pl-4 ml-4">
            <button className="btn btn-primary btn-sm">
              <Calendar className="w-4 h-4 mr-2" />
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex border-b border-gray-200">
          {/* Task Column Header */}
          <div className="w-80 px-4 py-3 bg-gray-50 border-r border-gray-200 flex-shrink-0">
            <h3 className="font-medium text-gray-900">Tasks</h3>
          </div>

          {/* Timeline Header */}
          <div className="flex-1 bg-gray-50">
            <div className="flex border-b border-gray-200">
              {dates.map((date, index) => (
                <div
                  key={index}
                  className={`flex-shrink-0 px-2 py-2 text-center border-r border-gray-200 ${
                    isSameDay(date, new Date()) ? 'bg-primary-50' : ''
                  }`}
                  style={{ width: `${zoomLevel}px` }}
                >
                  <div className={`text-xs font-medium ${
                    isSameDay(date, new Date()) ? 'text-primary-600' : 'text-gray-700'
                  }`}>
                    {format(date, 'EEE')}
                  </div>
                  <div className={`text-xs ${
                    isSameDay(date, new Date()) ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {format(date, 'dd')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gantt Rows */}
        <div className="max-h-96 overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedTasks.map(task => task.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedTasks.map((task) => (
                <GanttRow
                  key={task.id}
                  task={task}
                  startDate={viewStartDate}
                  dayWidth={zoomLevel}
                  onTaskMove={handleTaskMove}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-success-500 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary-500 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-danger-500 rounded"></div>
            <span>Delayed</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-600">
          💡 <strong>Tip:</strong> Drag tasks horizontally to reschedule. Dependencies will automatically adjust.
        </div>
      </div>
    </div>
  );
} 