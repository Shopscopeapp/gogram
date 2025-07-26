import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Plus, Filter, Settings } from 'lucide-react';
import { useAppStore } from '../../store';
import { format } from 'date-fns';
import GanttChart from '../gantt/GanttChart';

export default function SchedulePage() {
  const { tasks, currentProject, currentUser } = useAppStore();
  const [view, setView] = useState<'gantt' | 'list'>('gantt');

  if (!currentProject) {
    return <div>Loading...</div>;
  }

  // Sort tasks by start date for list view
  const sortedTasks = [...tasks].sort((a, b) => a.start_date.getTime() - b.start_date.getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-500';
      case 'in_progress': return 'bg-primary-500';
      case 'delayed': return 'bg-danger-500';
      case 'pending': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  const canEditSchedule = currentUser?.role === 'project_manager';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Schedule</h1>
          <p className="text-gray-600 mt-1">{currentProject.name}</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setView('gantt')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'gantt'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Gantt View
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              List View
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button className="btn btn-secondary btn-md">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
            {canEditSchedule && (
              <button className="btn btn-primary btn-md">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Content */}
      {view === 'gantt' ? (
        <div>
          {/* Interactive Gantt Chart */}
          <GanttChart />
          
          {/* Schedule Tips for Construction Workers */}
          <div className="mt-6 bg-primary-50 border border-primary-200 rounded-lg p-4">
            <h3 className="font-medium text-primary-900 mb-2">🏗️ Schedule Management Tips</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-primary-800">
              <div>
                <strong>Drag & Drop:</strong> Click and drag any task bar to reschedule it. Dependent tasks will automatically move.
              </div>
              <div>
                <strong>Dependencies:</strong> Tasks with chain icons depend on other tasks completing first.
              </div>
              <div>
                <strong>Colors:</strong> Green = completed, Blue = in progress, Red = delayed, Gray = pending.
              </div>
              <div>
                <strong>Zoom:</strong> Use +/- buttons to zoom in/out for better visibility of your timeline.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Tasks</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {sortedTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: task.color }}
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        <p className="text-sm text-gray-500">
                          {format(task.start_date, 'MMM dd')} - {format(task.end_date, 'MMM dd')} • {task.category}
                        </p>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 'completed' ? 'bg-success-100 text-success-800' :
                        task.status === 'in_progress' ? 'bg-primary-100 text-primary-800' :
                        task.status === 'delayed' ? 'bg-danger-100 text-danger-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'critical' ? 'bg-danger-100 text-danger-800' :
                        task.priority === 'high' ? 'bg-warning-100 text-warning-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.priority}
                      </span>
                      <div className="text-sm text-gray-500">
                        {task.planned_duration} days
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{tasks.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total Tasks</div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">
              {tasks.filter(t => t.status === 'in_progress').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">In Progress</div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-danger-600">
              {tasks.filter(t => t.status === 'delayed').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Delayed</div>
          </div>
        </div>
      </div>

      {/* Project Timeline Overview */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Project Timeline</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Project Duration</span>
              <span className="font-medium">
                {format(currentProject.startDate, 'MMM dd, yyyy')} - {format(currentProject.endDate, 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">
                {Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(tasks.filter(t => t.status === 'completed').length / tasks.length) * 100}%` 
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Started {format(currentProject.startDate, 'MMM dd')}</span>
              <span>Due {format(currentProject.endDate, 'MMM dd')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 