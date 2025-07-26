import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Plus, 
  Filter, 
  Search, 
  Calendar,
  Clock,
  User,
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format } from 'date-fns';

export default function TasksPage() {
  const { tasks, currentUser, updateTask } = useAppStore();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || task.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  const handleStatusUpdate = (taskId: string, newStatus: string) => {
    updateTask(taskId, { status: newStatus as any });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-100 text-success-800 border-success-200';
      case 'in_progress': return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'delayed': return 'bg-danger-100 text-danger-800 border-danger-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-danger-100 text-danger-800';
      case 'high': return 'bg-warning-100 text-warning-800';
      case 'medium': return 'bg-primary-100 text-primary-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Tasks', count: tasks.length },
    { value: 'pending', label: 'Pending', count: tasks.filter(t => t.status === 'pending').length },
    { value: 'in_progress', label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
    { value: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length },
    { value: 'delayed', label: 'Delayed', count: tasks.filter(t => t.status === 'delayed').length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage and track all project tasks</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn btn-secondary btn-md">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
          <button className="btn btn-primary btn-md">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {filterOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === option.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid gap-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Task Color Indicator */}
                    <div 
                      className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: task.color }}
                    />
                    
                    {/* Task Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {task.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 mb-3">{task.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(task.startDate, 'MMM dd')} - {format(task.endDate, 'MMM dd')}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {task.plannedDuration} days
                        </div>
                        <div className="flex items-center">
                          <CheckSquare className="w-4 h-4 mr-1" />
                          {task.category}
                        </div>
                        {task.location && (
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {task.location}
                          </div>
                        )}
                      </div>

                      {/* Dependencies */}
                      {task.dependencies.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center text-sm text-gray-500">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Depends on {task.dependencies.length} task(s)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Status and Actions */}
                  <div className="flex items-center space-x-3">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-primary-500 ${getStatusColor(task.status)}`}
                      disabled={!currentUser || currentUser.role === 'viewer'}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="delayed">Delayed</option>
                    </select>
                    
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Progress Bar for In Progress Tasks */}
                {task.status === 'in_progress' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>60%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full w-3/5"></div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? `No tasks match "${searchQuery}"`
                : `No ${filter === 'all' ? '' : filter} tasks available`
              }
            </p>
            <button className="btn btn-primary btn-md">
              <Plus className="w-4 h-4 mr-2" />
              Create New Task
            </button>
          </div>
        )}
      </div>

      {/* Task Summary Stats */}
      {filteredTasks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status === 'completed').length}
              </div>
              <div className="text-sm text-success-600">Completed</div>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status === 'in_progress').length}
              </div>
              <div className="text-sm text-primary-600">In Progress</div>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status === 'pending').length}
              </div>
              <div className="text-sm text-warning-600">Pending</div>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status === 'delayed').length}
              </div>
              <div className="text-sm text-danger-600">Delayed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 