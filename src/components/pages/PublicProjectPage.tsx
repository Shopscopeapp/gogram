import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  CheckSquare, 
  AlertTriangle,
  Building2,
  TrendingUp,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import publicSharingService from '../../services/publicSharingService';
import GanttChart from '../gantt/GanttChart';

interface PublicProject {
  id: string;
  name: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  status: string;
  progress_percentage: number;
  location?: string;
  client?: string;
}

interface PublicTask {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date: Date;
  end_date: Date;
  progress_percentage: number;
  color: string;
  dependencies: string[];
  // Required Task properties for GanttChart compatibility
  project_id: string;
  planned_duration: number;
  created_at: Date;
  updated_at: Date;
}

export default function PublicProjectPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<PublicProject | null>(null);
  const [tasks, setTasks] = useState<PublicTask[]>([]);
  const [viewMode, setViewMode] = useState<'gantt' | 'list'>('gantt');

  useEffect(() => {
    if (shareToken) {
      loadPublicProject(shareToken);
    }
  }, [shareToken]);

  const loadPublicProject = async (token: string) => {
    try {
      setLoading(true);
      setError(null);

      // Call the public API endpoint that bypasses RLS
      const apiUrl = import.meta.env.DEV 
        ? `http://localhost:3000/api/public-project?shareToken=${encodeURIComponent(token)}`
        : `/api/public-project?shareToken=${encodeURIComponent(token)}`;
        
      const response = await fetch(apiUrl);
      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('API error:', result.error);
        setError(result.error || 'Failed to load project data');
        return;
      }

      const { project: projectData, tasks: tasksData } = result.data;
      
      const publicProject: PublicProject = {
        id: projectData.id,
        name: projectData.name,
        description: projectData.description || '',
        start_date: new Date(projectData.start_date),
        end_date: new Date(projectData.end_date),
        status: projectData.status,
        progress_percentage: projectData.progress_percentage || 0,
        location: projectData.location || '',
        client: projectData.client || ''
      };

      const publicTasks: PublicTask[] = tasksData.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        category: task.category,
        status: task.status,
        priority: task.priority,
        start_date: new Date(task.start_date),
        end_date: new Date(task.end_date),
        progress_percentage: task.progress_percentage || 0,
        color: task.color || '#3b82f6',
        dependencies: task.dependencies || [],
        // Add required Task properties for GanttChart compatibility
        project_id: projectData.id,
        planned_duration: Math.ceil((new Date(task.end_date).getTime() - new Date(task.start_date).getTime()) / (1000 * 60 * 60 * 24)),
        created_at: new Date(task.start_date),
        updated_at: new Date()
      }));

      setProject(publicProject);
      setTasks(publicTasks);
    } catch (err) {
      setError('Failed to load project data');
      console.error('Error loading public project:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-danger-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Error</h1>
          <p className="text-gray-600 mb-4">{error || 'Project not found'}</p>
          <p className="text-sm text-gray-500">
            This link may have expired or been revoked. Contact the project manager for a new link.
          </p>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const delayedTasks = tasks.filter(t => t.status === 'delayed').length;

  const daysRemaining = differenceInDays(project.end_date, new Date());
  const totalDays = differenceInDays(project.end_date, project.start_date);
  const daysElapsed = totalDays - daysRemaining;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600 flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  Public Project View
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600">{project.progress_percentage}%</div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>

          {project.description && (
            <p className="mt-4 text-gray-700">{project.description}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            {project.client && (
              <div className="flex items-center">
                <Building2 className="w-4 h-4 mr-1" />
                Client: {project.client}
              </div>
            )}
            {project.location && (
              <div className="flex items-center">
                📍 {project.location}
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {format(project.start_date, 'MMM dd, yyyy')} - {format(project.end_date, 'MMM dd, yyyy')}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Project completed'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-success-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{completedTasks}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{inProgressTasks}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-warning-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{pendingTasks}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </div>

          {delayedTasks > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-danger-600" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">{delayedTasks}</p>
                  <p className="text-sm text-gray-600">Delayed</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{Math.round((daysElapsed / totalDays) * 100)}%</p>
                <p className="text-sm text-gray-600">Time Elapsed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">Overall Progress</h3>
            <span className="text-sm font-medium text-gray-600">{project.progress_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-primary-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${project.progress_percentage}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-sm text-gray-500">
            <span>Started {format(project.start_date, 'MMM dd, yyyy')}</span>
            <span>Due {format(project.end_date, 'MMM dd, yyyy')}</span>
          </div>
        </div>

        {/* View Toggle */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Project Schedule</h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('gantt')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'gantt'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Timeline View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List View
              </button>
            </div>
          </div>

          {viewMode === 'gantt' ? (
            <div className="overflow-x-auto">
              <GanttChart 
                tasks={tasks}
                onTaskMove={() => {}} // Read-only, no task moving
                readOnly={true}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.status === 'completed' ? 'bg-success-100 text-success-800' :
                          task.status === 'in_progress' ? 'bg-primary-100 text-primary-800' :
                          task.status === 'delayed' ? 'bg-danger-100 text-danger-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.priority === 'critical' ? 'bg-danger-100 text-danger-800' :
                          task.priority === 'high' ? 'bg-warning-100 text-warning-800' :
                          task.priority === 'medium' ? 'bg-primary-100 text-primary-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(task.start_date, 'MMM dd')} - {format(task.end_date, 'MMM dd')}
                        </div>
                        <div className="flex items-center">
                          <CheckSquare className="w-4 h-4 mr-1" />
                          {task.category}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">{task.progress_percentage}%</div>
                      <div className="text-xs text-gray-500">Complete</div>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${task.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-500">
            This is a public view of the project schedule. For detailed information or questions, 
            please contact the project manager.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
          </p>
        </div>
      </div>
    </div>
  );
} 