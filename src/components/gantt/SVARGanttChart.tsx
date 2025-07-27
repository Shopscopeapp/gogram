import React, { useMemo, useCallback } from 'react';
// @ts-ignore - SVAR Gantt doesn't have TypeScript declarations yet
import { Gantt } from 'wx-react-gantt';
import 'wx-react-gantt/dist/gantt.css';
import { Task } from '../../types';
import { format } from 'date-fns';

interface SVARGanttChartProps {
  tasks: Task[];
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskAdd?: (task: Partial<Task>) => void;
  onTaskDelete?: (taskId: string) => void;
  readOnly?: boolean;
  height?: string;
}

interface SVARTask {
  id: string;
  text: string;
  start_date: string;
  end_date: string;
  duration: number;
  progress: number;
  parent?: string;
  type?: 'task' | 'project' | 'milestone';
  color?: string;
  details?: {
    category?: string;
    location?: string;
    status?: string;
    priority?: string;
    assigned_to?: string;
    description?: string;
    requires_materials?: boolean;
    primary_supplier_id?: string;
    notes?: string;
  };
}

interface SVARLink {
  id: string;
  source: string;
  target: string;
  type: number; // 0: finish-to-start, 1: start-to-start, 2: finish-to-finish, 3: start-to-finish
}

export default function SVARGanttChart({
  tasks,
  onTaskUpdate,
  onTaskAdd,
  onTaskDelete,
  readOnly = false,
  height = '600px'
}: SVARGanttChartProps) {
  
  // Transform Gogram tasks to SVAR format
  const svarTasks = useMemo<SVARTask[]>(() => {
    return tasks.map(task => ({
      id: task.id,
      text: task.title,
      start_date: format(task.start_date, 'yyyy-MM-dd'),
      end_date: format(task.end_date, 'yyyy-MM-dd'),
      duration: task.planned_duration,
      progress: task.progress_percentage / 100, // SVAR expects 0-1, not 0-100
      type: 'task',
      color: task.color,
      details: {
        category: task.category,
        location: task.location,
        status: task.status,
        priority: task.priority,
        assigned_to: task.assigned_to,
        description: task.description,
        requires_materials: task.requires_materials,
        primary_supplier_id: task.primary_supplier_id,
        notes: task.notes,
      }
    }));
  }, [tasks]);

  // Transform dependencies to SVAR links format
  const svarLinks = useMemo<SVARLink[]>(() => {
    const links: SVARLink[] = [];
    
    tasks.forEach(task => {
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach(depId => {
          links.push({
            id: `${depId}-${task.id}`,
            source: depId,
            target: task.id,
            type: 0 // finish-to-start (most common in construction)
          });
        });
      }
    });
    
    return links;
  }, [tasks]);

  // Handle task updates from SVAR
  const handleTaskUpdate = useCallback((updatedTask: SVARTask) => {
    if (!onTaskUpdate) return;
    
    const originalTask = tasks.find(t => t.id === updatedTask.id);
    if (!originalTask) return;

    const updates: Partial<Task> = {
      title: updatedTask.text,
      start_date: new Date(updatedTask.start_date),
      end_date: new Date(updatedTask.end_date),
      planned_duration: updatedTask.duration,
      progress_percentage: Math.round(updatedTask.progress * 100), // Convert back to 0-100
      color: updatedTask.color || originalTask.color,
    };

    onTaskUpdate(updatedTask.id, updates);
  }, [tasks, onTaskUpdate]);

  // Handle new task creation from SVAR
  const handleTaskAdd = useCallback((newTask: SVARTask) => {
    if (!onTaskAdd) return;

    const task: Partial<Task> = {
      title: newTask.text,
      start_date: new Date(newTask.start_date),
      end_date: new Date(newTask.end_date),
      planned_duration: newTask.duration,
      progress_percentage: Math.round(newTask.progress * 100),
      color: newTask.color || '#3b82f6',
      category: newTask.details?.category || 'General',
      status: 'pending',
      priority: (newTask.details?.priority as any) || 'medium',
      dependencies: [],
    };

    onTaskAdd(task);
  }, [onTaskAdd]);

  // Handle task deletion from SVAR
  const handleTaskDelete = useCallback((taskId: string) => {
    if (!onTaskDelete) return;
    onTaskDelete(taskId);
  }, [onTaskDelete]);

  // Handle link updates (dependencies)
  const handleLinkUpdate = useCallback((link: SVARLink, action: 'create' | 'update' | 'delete') => {
    if (!onTaskUpdate) return;

    const targetTask = tasks.find(t => t.id === link.target);
    if (!targetTask) return;

    let newDependencies = [...targetTask.dependencies];

    if (action === 'create') {
      if (!newDependencies.includes(link.source)) {
        newDependencies.push(link.source);
      }
    } else if (action === 'delete') {
      newDependencies = newDependencies.filter(dep => dep !== link.source);
    }

    onTaskUpdate(link.target, { dependencies: newDependencies });
  }, [tasks, onTaskUpdate]);

  // SVAR configuration
  const ganttConfig = {
    // Time scale configuration
    scales: [
      { unit: 'month', step: 1, format: 'MMM yyyy' },
      { unit: 'day', step: 1, format: 'd' }
    ],
    
    // Grid columns configuration
    columns: [
      {
        name: 'text',
        label: 'Task Name',
        width: 200,
        tree: true,
        resize: true
      },
      {
        name: 'start_date',
        label: 'Start Date',
        width: 100,
        align: 'center'
      },
      {
        name: 'duration',
        label: 'Duration',
        width: 80,
        align: 'center'
      },
      {
        name: 'progress',
        label: 'Progress',
        width: 80,
        align: 'center',
        template: (task: SVARTask) => `${Math.round(task.progress * 100)}%`
      }
    ],

    // Task bar template for construction-specific styling
    taskTemplate: (task: SVARTask) => {
      const priorityColors = {
        critical: '#ef4444',
        high: '#f97316', 
        medium: '#eab308',
        low: '#22c55e'
      };

      const statusIcons = {
        pending: '⏳',
        in_progress: '🔄',
        completed: '✅',
        delayed: '⚠️'
      };

      return `
        <div class="custom-task-bar" style="
          background: ${task.color || '#3b82f6'};
          border-left: 4px solid ${priorityColors[task.details?.priority as keyof typeof priorityColors] || '#3b82f6'};
          height: 100%;
          display: flex;
          align-items: center;
          padding: 0 8px;
          color: white;
          font-size: 12px;
          font-weight: 500;
          border-radius: 4px;
        ">
          <span style="margin-right: 4px;">
            ${statusIcons[task.details?.status as keyof typeof statusIcons] || '📋'}
          </span>
          <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">
            ${task.text}
          </span>
          <span style="margin-left: 4px; font-size: 10px; opacity: 0.8;">
            ${Math.round(task.progress * 100)}%
          </span>
        </div>
      `;
    },

    // Tooltip configuration
    tooltip: {
      template: (task: SVARTask) => `
        <div style="padding: 12px; max-width: 300px;">
          <div style="font-weight: bold; margin-bottom: 8px;">${task.text}</div>
          <div style="margin-bottom: 4px;"><strong>Category:</strong> ${task.details?.category || 'N/A'}</div>
          <div style="margin-bottom: 4px;"><strong>Status:</strong> ${task.details?.status || 'N/A'}</div>
          <div style="margin-bottom: 4px;"><strong>Priority:</strong> ${task.details?.priority || 'N/A'}</div>
          <div style="margin-bottom: 4px;"><strong>Duration:</strong> ${task.duration} days</div>
          <div style="margin-bottom: 4px;"><strong>Progress:</strong> ${Math.round(task.progress * 100)}%</div>
          ${task.details?.location ? `<div style="margin-bottom: 4px;"><strong>Location:</strong> ${task.details.location}</div>` : ''}
          ${task.details?.requires_materials ? '<div style="margin-bottom: 4px;"><strong>📦 Requires Materials</strong></div>' : ''}
          ${task.details?.primary_supplier_id ? '<div style="margin-bottom: 4px;"><strong>🚚 Supplier Assigned</strong></div>' : ''}
          ${task.details?.description ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;"><em>${task.details.description}</em></div>` : ''}
        </div>
      `
    },

    // Enable/disable editing based on readOnly prop
    readonly: readOnly,
    
    // Enable modern features
    drag_timeline: !readOnly,
    drag_resize: !readOnly,
    drag_progress: !readOnly,
    drag_links: !readOnly,
    
    // Performance optimizations
    optimize_render: true,
    
    // Construction-friendly settings
    working_time: {
      hours: [8, 17], // 8 AM to 5 PM
      days: [1, 2, 3, 4, 5] // Monday to Friday
    },
    
    // Auto-scheduling for dependencies
    auto_scheduling: true,
    auto_scheduling_strict: true,
  };

  return (
    <div style={{ height, width: '100%' }}>
      <Gantt
        data={svarTasks}
        links={svarLinks}
        config={ganttConfig}
        onTaskUpdate={handleTaskUpdate}
        onTaskAdd={handleTaskAdd}
        onTaskDelete={handleTaskDelete}
        onLinkUpdate={handleLinkUpdate}
      />
      
      {/* Custom CSS for professional styling */}
      <style>{`
        .custom-task-bar {
          transition: all 0.2s ease;
        }
        
        .custom-task-bar:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        /* Construction-themed colors */
        .gantt_task_line.gantt_critical {
          background: linear-gradient(90deg, #ef4444, #dc2626) !important;
        }
        
        .gantt_task_line.gantt_high {
          background: linear-gradient(90deg, #f97316, #ea580c) !important;
        }
        
        .gantt_task_line.gantt_medium {
          background: linear-gradient(90deg, #eab308, #ca8a04) !important;
        }
        
        .gantt_task_line.gantt_low {
          background: linear-gradient(90deg, #22c55e, #16a34a) !important;
        }
        
        /* Professional grid styling */
        .gantt_grid_scale,
        .gantt_grid_head_cell {
          background: #f8fafc !important;
          border-color: #e2e8f0 !important;
          font-weight: 600 !important;
        }
        
        .gantt_row:nth-child(even) {
          background: #f8fafc !important;
        }
        
        /* Dependency lines styling */
        .gantt_line_wrapper {
          stroke: #6366f1 !important;
          stroke-width: 2 !important;
        }
        
        .gantt_link_arrow {
          fill: #6366f1 !important;
        }
      `}</style>
    </div>
  );
} 