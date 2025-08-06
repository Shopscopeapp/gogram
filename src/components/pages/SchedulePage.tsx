import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Calendar, 
  List, 
  Filter, 
  Download,
  Search,
  BarChart3,
  Smartphone,
  Monitor,
  MoreVertical,
  Eye,
  MessageSquare,
  Clock,
  Settings
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format } from 'date-fns';
import GanttChart from '../gantt/GanttChart';
import GanttComparison from '../gantt/GanttComparison';
import AddTaskModal from '../modals/AddTaskModal';
import DeliveryResponseLog from '../schedule/DeliveryResponseLog';
import type { Task } from '../../types';
import toast from 'react-hot-toast';
import { taskService } from '../../services/taskService';

export default function SchedulePage() {
  const { tasks, currentProject, currentUser, addTask, updateTask, moveTask, removeTask, deliveryResponses } = useAppStore();
  const [activeTab, setActiveTab] = useState<'schedule' | 'responses'>('schedule');
  const [view, setView] = useState<'gantt' | 'list' | 'comparison'>('gantt');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Debug: Log tasks when they change
  useEffect(() => {
    console.log('SchedulePage: Tasks updated', tasks.length);
    tasks.forEach(task => {
      console.log(`Task ${task.id}: ${task.title} - ${task.start_date} to ${task.end_date}`);
    });
  }, [tasks]);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add sample tasks with hierarchical structure for testing
  // useEffect(() => {
  //   if (tasks.length === 0) {
  //     const sampleTasks: Task[] = [
  //       // ... sample tasks removed for now
  //     ];
  //     
  //     // Add sample tasks to the store
  //     sampleTasks.forEach(task => {
  //       const { id, created_at, updated_at, actual_start_date, actual_end_date, actual_duration, progress_percentage, attachments, created_by, ...taskData } = task;
  //       taskService.createTask(taskData, currentUser?.id || '');
  //     });
  //   }
  // }, [tasks.length, currentProject?.id]);

  if (!currentProject) {
    return <div>Loading...</div>;
  }

  // Handle task click to open edit modal
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowEditTaskModal(true);
  };

  // Sort tasks by start date for natural timeline order, only use updated_at for manual reordering
  const sortedTasks = [...tasks].sort((a, b) => {
    // Primary sort by start date for natural timeline order
    const aStartTime = new Date(a.start_date).getTime();
    const bStartTime = new Date(b.start_date).getTime();
    if (aStartTime !== bStartTime) {
      return aStartTime - bStartTime; // Earliest start date first
    }
    // Secondary sort by creation date to maintain stable order
    const aCreatedTime = new Date(a.created_at).getTime();
    const bCreatedTime = new Date(b.created_at).getTime();
    return aCreatedTime - bCreatedTime;
  });

  // Filter tasks based on search and status
  const filteredTasks = sortedTasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleTaskReorder = (draggedTaskId: string, overId: string) => {
    console.log('Reordering task:', draggedTaskId, 'over:', overId);
    const currentTasks = [...filteredTasks];
    const draggedTaskIndex = currentTasks.findIndex(t => t.id === draggedTaskId);
    const overTaskIndex = currentTasks.findIndex(t => t.id === overId);

    if (draggedTaskIndex !== -1 && overTaskIndex !== -1) {
      const [draggedTask] = currentTasks.splice(draggedTaskIndex, 1);
      currentTasks.splice(overTaskIndex, 0, draggedTask);

      currentTasks.forEach((task, index) => {
        updateTask(task.id, {
          updated_at: new Date(Date.now() + index * 1000)
        });
      });
    }
  };

  const taskStats = {
    total: filteredTasks.length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
    inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
    pending: filteredTasks.filter(t => t.status === 'pending').length,
    overdue: filteredTasks.filter(t => {
      const now = new Date();
      const endDate = new Date(t.end_date);
      return endDate < now && t.status !== 'completed';
    }).length
  };

  // Mobile-optimized list view
  const renderMobileListView = () => (
    <div className="space-y-3">
      {filteredTasks.map((task) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
          onClick={() => handleTaskClick(task)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-2">
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {task.description}
                </p>
              )}
            </div>
            <div className="ml-3 flex-shrink-0">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                task.status === 'completed' ? 'bg-green-100 text-green-800' :
                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                task.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {format(new Date(task.start_date), 'MMM dd')}
              </span>
            </div>
            <div className="flex items-center">
              {(task.progress_percentage || 0) > 0 && (
                <div className="flex items-center mr-3">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress_percentage || 0}%` }}
                    />
                  </div>
                  <span className="text-xs">{task.progress_percentage || 0}%</span>
                </div>
              )}
              <MoreVertical className="w-4 h-4" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  // Desktop list view
  const renderDesktopListView = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <tr 
                key={task.id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleTaskClick(task)}
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {task.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    task.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {/* User assignment removed */}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    <div>{format(new Date(task.start_date), 'MMM dd, yyyy')}</div>
                    <div>{format(new Date(task.end_date), 'MMM dd, yyyy')}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${task.progress_percentage || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-900">{task.progress_percentage || 0}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskClick(task);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Schedule</h1>
          <p className="text-gray-600">
            Manage project timeline and task dependencies
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Schedule & Tasks</span>
              <span className="sm:hidden">Schedule</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('responses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'responses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Delivery Responses</span>
              <span className="sm:hidden">Responses</span>
              {deliveryResponses.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {deliveryResponses.length}
                </span>
              )}
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {/* Schedule Tab Header Controls */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div></div>
        
        {/* Desktop Controls */}
        {!isMobile && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('gantt')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'gantt'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Gantt
              </button>
              <button
                onClick={() => setView('comparison')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'comparison'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Compare
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </button>
            </div>
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </button>
          </div>
        )}

        {/* Mobile Controls */}
        {isMobile && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setView(view === 'gantt' ? 'list' : 'gantt')}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {view === 'gantt' ? (
                  <>
                    <List className="w-4 h-4 mr-2" />
                    List
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Chart
                  </>
                )}
              </button>
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
            </div>
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="btn btn-primary text-sm px-4 py-2"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
          <div className="text-xl md:text-2xl font-bold text-gray-900">{taskStats.total}</div>
          <div className="text-xs md:text-sm text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
          <div className="text-xl md:text-2xl font-bold text-green-600">{taskStats.completed}</div>
          <div className="text-xs md:text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
          <div className="text-xl md:text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
          <div className="text-xs md:text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
          <div className="text-xl md:text-2xl font-bold text-gray-600">{taskStats.pending}</div>
          <div className="text-xs md:text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
          <div className="text-xl md:text-2xl font-bold text-red-600">{taskStats.overdue}</div>
          <div className="text-xs md:text-sm text-gray-600">Overdue</div>
        </div>
      </div>

      {/* Mobile Filters Panel */}
      {isMobile && showMobileFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-4 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Tasks
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </motion.div>
      )}

      {/* Desktop Filters */}
      {!isMobile && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {view === 'comparison' ? (
          <div className="p-6">
            <GanttComparison
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
              onTaskUpdate={(taskId: string, updates: Partial<Task>) => {
                  console.log('SchedulePage: Updating task', taskId, updates);
                  updateTask(taskId, updates);
                  console.log('SchedulePage: Task update called');
                }}
              readOnly={!currentUser || currentUser.role === 'viewer'}
            />
          </div>
        ) : view === 'gantt' ? (
          <>
            <div className="h-[600px] md:h-[700px]">
              <GanttChart
                tasks={filteredTasks}
                onTaskMove={(taskId: string, newStartDate: Date, newEndDate: Date) => {
                  console.log('SchedulePage: Moving task', taskId, newStartDate, newEndDate);
                  updateTask(taskId, {
                    start_date: newStartDate,
                    end_date: newEndDate
                  });
                  console.log('SchedulePage: Task move called');
                }}
                onTaskClick={handleTaskClick}
                onTaskReorder={handleTaskReorder}
                onAddTask={() => setShowAddTaskModal(true)}
                readOnly={false}
                showDependencies={true}
              />
            </div>
            
            {/* Gantt Chart Legend */}
            <div className="bg-gray-50 border-t border-gray-200 p-4">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <span className="text-gray-700">Normal Task</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                  <span className="text-gray-700">Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-gray-700">In Progress</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-gray-700">Overdue</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-600 rounded animate-pulse"></div>
                  <span className="text-gray-700">Critical</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-gray-700">Milestone</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-700">Today</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  <strong>Tip:</strong> Drag tasks to reschedule, click to edit, or use the floating + button to add new tasks.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 md:p-6">
            {isMobile ? renderMobileListView() : renderDesktopListView()}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onAddTask={(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
          addTask(taskData);
          toast.success('Task added successfully!');
        }}
      />

      {/* Edit Task Modal */}
      <AddTaskModal
        isOpen={showEditTaskModal}
        onClose={() => setShowEditTaskModal(false)}
        onAddTask={(updatedTaskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
          if (selectedTask) {
            updateTask(selectedTask.id, updatedTaskData);
            toast.success('Task updated successfully!');
          }
        }}
        onDeleteTask={(taskId: string) => {
          removeTask(taskId);
          setShowEditTaskModal(false);
          setSelectedTask(null);
        }}
        initialData={selectedTask ?? undefined}
        isEditMode={true}
      />
        </div>
      )}

      {/* Delivery Responses Tab */}
      {activeTab === 'responses' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                Delivery Response Log
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Track supplier responses to delivery date change notifications
              </p>
            </div>
            <DeliveryResponseLog responses={deliveryResponses} />
          </div>
        </div>
      )}
    </div>
  );
} 