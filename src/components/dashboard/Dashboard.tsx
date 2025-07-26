import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Users,
  Truck,
  Activity
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format, isToday, isTomorrow, addDays } from 'date-fns';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  change?: string;
}

function StatCard({ title, value, icon: Icon, color, change }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className="text-sm text-success-600 mt-1">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

interface TaskItemProps {
  task: any;
  showDate?: boolean;
}

function TaskItem({ task, showDate = false }: TaskItemProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-danger-100 text-danger-800';
      case 'high': return 'bg-warning-100 text-warning-800';
      case 'medium': return 'bg-primary-100 text-primary-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success-600';
      case 'in_progress': return 'text-primary-600';
      case 'delayed': return 'text-danger-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className={`w-3 h-3 rounded-full ${task.color ? '' : 'bg-gray-300'}`} 
           style={{ backgroundColor: task.color }} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{task.title}</p>
        <div className="flex items-center space-x-2 mt-1">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          <span className={`text-sm ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
          {showDate && (
            <span className="text-sm text-gray-500">
              {format(task.endDate, 'MMM dd')}
            </span>
          )}
        </div>
      </div>
      <div className="text-sm text-gray-500">
        {task.category}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { 
    currentUser, 
    currentProject, 
    tasks, 
    dashboardStats,
    deliveries,
    isProjectManager 
  } = useAppStore();

  if (!currentUser || !currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Get upcoming tasks (next 7 days)
  const upcomingTasks = tasks
    .filter(task => {
      const daysUntil = Math.ceil((task.end_date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 7 && daysUntil >= 0 && task.status !== 'completed';
    })
    .sort((a, b) => a.end_date.getTime() - b.end_date.getTime())
    .slice(0, 5);

  // Get active tasks
  const activeTasks = tasks
    .filter(task => task.status === 'in_progress')
    .slice(0, 3);

  // Get recent deliveries
  const recentDeliveries = deliveries
    .filter(delivery => delivery.confirmation_status === 'pending')
    .slice(0, 4);

  const welcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${greeting}, ${currentUser.full_name.split(' ')[0]}!`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{welcomeMessage()}</h1>
            <p className="mt-1 opacity-90">
              Here's what's happening on {currentProject.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-75">Today</p>
            <p className="text-lg font-semibold">
              {format(new Date(), 'EEEE, MMM dd')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks"
          value={dashboardStats.totalTasks}
          icon={CheckSquare}
          color="bg-primary-600"
          change="+12% from last week"
        />
        <StatCard
          title="Completed"
          value={dashboardStats.completedTasks}
          icon={Calendar}
          color="bg-success-600"
        />
        <StatCard
          title="Due Soon"
          value={dashboardStats.upcomingDeadlines}
          icon={Clock}
          color="bg-warning-600"
        />
        <StatCard
          title="Delayed"
          value={dashboardStats.delayedTasks}
          icon={AlertTriangle}
          color="bg-danger-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Tasks */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Active Tasks</h2>
                <span className="text-sm text-gray-500">
                  {activeTasks.length} in progress
                </span>
              </div>
            </div>
            <div className="p-6">
              {activeTasks.length > 0 ? (
                <div className="space-y-4">
                  {activeTasks.map(task => (
                    <TaskItem key={task.id} task={task} showDate />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No active tasks</p>
                  <p className="text-sm text-gray-500">All tasks are completed or pending</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div>
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
            </div>
            <div className="p-6">
              {upcomingTasks.length > 0 ? (
                <div className="space-y-4">
                  {upcomingTasks.map(task => {
                    const isTaskToday = isToday(task.end_date);
                    const isTaskTomorrow = isTomorrow(task.end_date);
                    
                    return (
                      <div key={task.id} className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          isTaskToday ? 'bg-danger-500' : 
                          isTaskTomorrow ? 'bg-warning-500' : 'bg-gray-300'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {isTaskToday ? 'Due today' :
                             isTaskTomorrow ? 'Due tomorrow' :
                             format(task.end_date, 'MMM dd')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Deliveries */}
      {isProjectManager() && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Pending Deliveries</h2>
            </div>
            <div className="p-6">
              {recentDeliveries.length > 0 ? (
                <div className="space-y-4">
                  {recentDeliveries.map(delivery => (
                    <div key={delivery.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{delivery.item}</p>
                        <p className="text-sm text-gray-500">
                          {delivery.quantity} {delivery.unit} • {format(delivery.plannedDate, 'MMM dd')}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        delivery.confirmationStatus === 'confirmed' 
                          ? 'bg-success-100 text-success-800'
                          : delivery.confirmationStatus === 'rejected'
                          ? 'bg-danger-100 text-danger-800'
                          : 'bg-warning-100 text-warning-800'
                      }`}>
                        {delivery.confirmationStatus}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Truck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No pending deliveries</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Project Progress</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{Math.round((dashboardStats.completedTasks / dashboardStats.totalTasks) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(dashboardStats.completedTasks / dashboardStats.totalTasks) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success-600">{dashboardStats.completedTasks}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">
                      {dashboardStats.totalTasks - dashboardStats.completedTasks}
                    </p>
                    <p className="text-sm text-gray-600">Remaining</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 