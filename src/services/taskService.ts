import { supabase } from '../lib/supabase';
import type { Task, TaskDelay, TaskChangeProposal } from '../types';

export interface CreateTaskData {
  project_id: string;
  title: string;
  description?: string;
  category: string;
  location?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  start_date: Date;
  end_date: Date;
  planned_duration: number;
  color: string;
  dependencies: string[];
  notes?: string;
  // Supplier/Procurement fields
  primary_supplier_id?: string;
  requires_materials?: boolean;
  material_delivery_date?: Date;
  procurement_notes?: string;
  // ITP fields
  itp_requirements?: string[];
  // Construction-specific fields
  phase?: string;
  sub_phase?: string;
  predecessors?: string[];
  successors?: string[];
  lag_days?: number;
  lead_days?: number;
  float_days?: number;
  free_float_days?: number;
  is_critical?: boolean;
  resource_names?: string[];
  crew_size?: number;
  equipment_needed?: string[];
  weather_dependent?: boolean;
  work_hours_per_day?: number;
  work_days_per_week?: number;
  cost_per_day?: number;
  total_cost?: number;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  actual_start_date?: Date;
  actual_end_date?: Date;
  progress_percentage?: number;
  actual_duration?: number;
}

class TaskService {
  /**
   * Create a new task
   */
  async createTask(taskData: CreateTaskData, userId: string): Promise<{ success: boolean; task?: Task; error?: string }> {
    try {
      // First, create the task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          project_id: taskData.project_id,
          title: taskData.title,
          description: taskData.description,
          category: taskData.category,
          location: taskData.location,
          status: taskData.status,
          priority: taskData.priority,
          assigned_to: taskData.assigned_to,
          start_date: taskData.start_date instanceof Date && !isNaN(taskData.start_date.getTime()) 
            ? taskData.start_date.toISOString() 
            : new Date().toISOString(),
          end_date: taskData.end_date instanceof Date && !isNaN(taskData.end_date.getTime()) 
            ? taskData.end_date.toISOString() 
            : new Date().toISOString(),
          planned_duration: taskData.planned_duration,
          progress_percentage: 0,
          color: taskData.color,
          notes: taskData.notes,
          // Supplier/Procurement fields
          primary_supplier_id: taskData.primary_supplier_id,
          requires_materials: taskData.requires_materials || false,
          material_delivery_date: taskData.material_delivery_date instanceof Date && !isNaN(taskData.material_delivery_date.getTime())
            ? taskData.material_delivery_date.toISOString()
            : null,
          procurement_notes: taskData.procurement_notes,
          // ITP fields
          itp_requirements: taskData.itp_requirements || [],
          // Construction-specific fields
          phase: taskData.phase,
          sub_phase: taskData.sub_phase,
          predecessors: taskData.predecessors || [],
          successors: taskData.successors || [],
          lag_days: taskData.lag_days || 0,
          lead_days: taskData.lead_days || 0,
          float_days: taskData.float_days || 0,
          free_float_days: taskData.free_float_days || 0,
          is_critical: taskData.is_critical || false,
          resource_names: taskData.resource_names || [],
          crew_size: taskData.crew_size || 1,
          equipment_needed: taskData.equipment_needed || [],
          weather_dependent: taskData.weather_dependent || false,
          work_hours_per_day: taskData.work_hours_per_day || 8,
          work_days_per_week: taskData.work_days_per_week || 5,
          cost_per_day: taskData.cost_per_day || 0,
          total_cost: taskData.total_cost || 0,
          created_by: userId,
        })
        .select()
        .single();

      if (taskError) {
        console.error('Task creation error:', taskError);
        return { success: false, error: 'Failed to create task' };
      }

      // Insert task dependencies
      if (taskData.dependencies && taskData.dependencies.length > 0) {
        const dependencyInserts = taskData.dependencies.map(depId => ({
          task_id: task.id,
          depends_on_task_id: depId,
        }));

        const { error: depsError } = await supabase
          .from('task_dependencies')
          .insert(dependencyInserts);

        if (depsError) {
          console.error('Task dependencies error:', depsError);
          // Don't fail the task creation for dependency errors
        }
      }

      const formattedTask: Task = {
        id: task.id,
        project_id: task.project_id,
        title: task.title,
        description: task.description,
        category: task.category,
        location: task.location,
        status: task.status,
        priority: task.priority,
        assigned_to: task.assigned_to,
        start_date: new Date(task.start_date),
        end_date: new Date(task.end_date),
        actual_start_date: task.actual_start_date ? new Date(task.actual_start_date) : undefined,
        actual_end_date: task.actual_end_date ? new Date(task.actual_end_date) : undefined,
        planned_duration: task.planned_duration,
        actual_duration: task.actual_duration,
        progress_percentage: task.progress_percentage,
        color: task.color,
        dependencies: taskData.dependencies,
        notes: task.notes,
        attachments: task.attachments || [],
        primary_supplier_id: task.primary_supplier_id,

        material_delivery_date: task.material_delivery_date ? new Date(task.material_delivery_date) : undefined,
        procurement_notes: task.procurement_notes,
        created_by: task.created_by,
        created_at: new Date(task.created_at),
        updated_at: new Date(task.updated_at),
      };

      return { success: true, task: formattedTask };
    } catch (error) {
      console.error('Create task error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get all tasks for a project
   */
  async getProjectTasks(projectId: string): Promise<{ success: boolean; tasks?: Task[]; error?: string }> {
    try {
      // Get tasks with their dependencies
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          task_dependencies!task_dependencies_task_id_fkey (
            depends_on_task_id
          )
        `)
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });

      if (tasksError) {
        console.error('Get project tasks error:', tasksError);
        return { success: false, error: 'Failed to fetch tasks' };
      }

      const formattedTasks: Task[] = tasks.map(task => ({
        id: task.id,
        project_id: task.project_id,
        title: task.title,
        description: task.description,
        category: task.category,
        location: task.location,
        status: task.status,
        priority: task.priority,
        assigned_to: task.assigned_to,
        start_date: new Date(task.start_date),
        end_date: new Date(task.end_date),
        actual_start_date: task.actual_start_date ? new Date(task.actual_start_date) : undefined,
        actual_end_date: task.actual_end_date ? new Date(task.actual_end_date) : undefined,
        planned_duration: task.planned_duration,
        actual_duration: task.actual_duration,
        progress_percentage: task.progress_percentage,
        color: task.color,
        dependencies: task.task_dependencies?.map((dep: any) => dep.depends_on_task_id) || [],
        notes: task.notes,
        attachments: task.attachments || [],
        primary_supplier_id: task.primary_supplier_id,
        material_delivery_date: task.material_delivery_date ? new Date(task.material_delivery_date) : undefined,
        procurement_notes: task.procurement_notes,
        created_by: task.created_by,
        created_at: new Date(task.created_at),
        updated_at: new Date(task.updated_at),
      }));

      return { success: true, tasks: formattedTasks };
    } catch (error) {
      console.error('Get project tasks error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Update a task
   */
  async updateTask(taskId: string, updates: UpdateTaskData, userId: string): Promise<{ success: boolean; task?: Task; error?: string }> {
    try {
      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Map all possible updates
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.assigned_to !== undefined) updateData.assigned_to = updates.assigned_to;
      if (updates.start_date !== undefined) {
        if (updates.start_date instanceof Date && !isNaN(updates.start_date.getTime())) {
          updateData.start_date = updates.start_date.toISOString();
        }
      }
      if (updates.end_date !== undefined) {
        if (updates.end_date instanceof Date && !isNaN(updates.end_date.getTime())) {
          updateData.end_date = updates.end_date.toISOString();
        }
      }
      if (updates.actual_start_date !== undefined) {
        if (updates.actual_start_date instanceof Date && !isNaN(updates.actual_start_date.getTime())) {
          updateData.actual_start_date = updates.actual_start_date.toISOString();
        }
      }
      if (updates.actual_end_date !== undefined) {
        if (updates.actual_end_date instanceof Date && !isNaN(updates.actual_end_date.getTime())) {
          updateData.actual_end_date = updates.actual_end_date.toISOString();
        }
      }
      if (updates.planned_duration !== undefined) updateData.planned_duration = updates.planned_duration;
      if (updates.actual_duration !== undefined) updateData.actual_duration = updates.actual_duration;
      if (updates.progress_percentage !== undefined) updateData.progress_percentage = updates.progress_percentage;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.primary_supplier_id !== undefined) updateData.primary_supplier_id = updates.primary_supplier_id;
      if (updates.material_delivery_date !== undefined) {
        if (updates.material_delivery_date instanceof Date && !isNaN(updates.material_delivery_date.getTime())) {
          updateData.material_delivery_date = updates.material_delivery_date.toISOString();
        }
      }
      if (updates.procurement_notes !== undefined) updateData.procurement_notes = updates.procurement_notes;

      // Update the task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single();

      if (taskError) {
        console.error('Task update error:', taskError);
        return { success: false, error: 'Failed to update task' };
      }

      // Handle dependencies update if provided
      if (updates.dependencies !== undefined) {
        // Delete existing dependencies
        await supabase
          .from('task_dependencies')
          .delete()
          .eq('task_id', taskId);

        // Insert new dependencies
        if (updates.dependencies.length > 0) {
          const dependencyInserts = updates.dependencies.map(depId => ({
            task_id: taskId,
            depends_on_task_id: depId,
          }));

          await supabase
            .from('task_dependencies')
            .insert(dependencyInserts);
        }
      }

      // Get updated task with dependencies
      const taskResult = await this.getTaskById(taskId);
      if (taskResult.success && taskResult.task) {
        return { success: true, task: taskResult.task };
      }

      return { success: false, error: 'Failed to fetch updated task' };
    } catch (error) {
      console.error('Update task error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(taskId: string): Promise<{ success: boolean; task?: Task; error?: string }> {
    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_dependencies!task_dependencies_task_id_fkey (
            depends_on_task_id
          )
        `)
        .eq('id', taskId)
        .single();

      if (error) {
        console.error('Get task error:', error);
        return { success: false, error: 'Task not found' };
      }

      const formattedTask: Task = {
        id: task.id,
        project_id: task.project_id,
        title: task.title,
        description: task.description,
        category: task.category,
        location: task.location,
        status: task.status,
        priority: task.priority,
        assigned_to: task.assigned_to,
        start_date: new Date(task.start_date),
        end_date: new Date(task.end_date),
        actual_start_date: task.actual_start_date ? new Date(task.actual_start_date) : undefined,
        actual_end_date: task.actual_end_date ? new Date(task.actual_end_date) : undefined,
        planned_duration: task.planned_duration,
        actual_duration: task.actual_duration,
        progress_percentage: task.progress_percentage,
        color: task.color,
        dependencies: task.task_dependencies?.map((dep: any) => dep.depends_on_task_id) || [],
        notes: task.notes,
        attachments: task.attachments || [],
        primary_supplier_id: task.primary_supplier_id,
        material_delivery_date: task.material_delivery_date ? new Date(task.material_delivery_date) : undefined,
        procurement_notes: task.procurement_notes,
        created_by: task.created_by,
        created_at: new Date(task.created_at),
        updated_at: new Date(task.updated_at),
      };

      return { success: true, task: formattedTask };
    } catch (error) {
      console.error('Get task error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user has permission (could be enhanced with more specific checks)
      const { data: task } = await supabase
        .from('tasks')
        .select('project_id')
        .eq('id', taskId)
        .single();

      if (!task) {
        return { success: false, error: 'Task not found' };
      }

      // Delete task dependencies first (foreign key constraints)
      await supabase
        .from('task_dependencies')
        .delete()
        .eq('task_id', taskId);

      await supabase
        .from('task_dependencies')
        .delete()
        .eq('depends_on_task_id', taskId);

      // Delete the task
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Delete task error:', error);
        return { success: false, error: 'Failed to delete task' };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete task error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Move task (update dates and handle dependencies)
   */
  async moveTask(taskId: string, newStartDate: Date, newEndDate: Date, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.updateTask(taskId, {
        start_date: newStartDate,
        end_date: newEndDate,
      }, userId);

      return { success: result.success, error: result.error };
    } catch (error) {
      console.error('Move task error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get task delays for a project
   */
  async getProjectTaskDelays(projectId: string): Promise<{ success: boolean; delays?: TaskDelay[]; error?: string }> {
    try {
      const { data: delays, error } = await supabase
        .from('task_delays')
        .select(`
          *,
          tasks!inner (
            project_id,
            title
          )
        `)
        .eq('tasks.project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get task delays error:', error);
        return { success: false, error: 'Failed to fetch task delays' };
      }

      const formattedDelays: TaskDelay[] = delays.map(delay => ({
        id: delay.id,
        task_id: delay.task_id,
        original_end_date: new Date(delay.original_end_date),
        new_end_date: new Date(delay.new_end_date),
        delay_days: delay.delay_days,
        reason: delay.reason,
        impact: delay.impact,
        impact_assessment: delay.impact_assessment,
        responsible_party: delay.responsible_party,
        mitigation_actions: delay.mitigation_actions,
        cost_impact: delay.cost_impact,
        reported_by: delay.reported_by,
        created_at: new Date(delay.created_at),
      }));

      return { success: true, delays: formattedDelays };
    } catch (error) {
      console.error('Get task delays error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Create task delay record
   */
  async createTaskDelay(delayData: {
    task_id: string;
    original_end_date: Date;
    new_end_date: Date;
    delay_days: number;
    reason: string;
    impact?: string;
    responsible_party?: string;
    mitigation_actions?: string;
    cost_impact?: number;
  }, userId: string): Promise<{ success: boolean; delay?: TaskDelay; error?: string }> {
    try {
      const { data: delay, error } = await supabase
        .from('task_delays')
        .insert({
          task_id: delayData.task_id,
          original_end_date: delayData.original_end_date.toISOString(),
          new_end_date: delayData.new_end_date.toISOString(),
          delay_days: delayData.delay_days,
          reason: delayData.reason,
          impact: delayData.impact,
          responsible_party: delayData.responsible_party,
          mitigation_actions: delayData.mitigation_actions,
          cost_impact: delayData.cost_impact,
          reported_by: userId,
        })
        .select()
        .single();

      if (error) {
        console.error('Create task delay error:', error);
        return { success: false, error: 'Failed to create task delay record' };
      }

      const formattedDelay: TaskDelay = {
        id: delay.id,
        task_id: delay.task_id,
        original_end_date: new Date(delay.original_end_date),
        new_end_date: new Date(delay.new_end_date),
        delay_days: delay.delay_days,
        reason: delay.reason,
        impact: delay.impact,
        impact_assessment: delay.impact_assessment,
        responsible_party: delay.responsible_party,
        mitigation_actions: delay.mitigation_actions,
        cost_impact: delay.cost_impact,
        reported_by: delay.reported_by,
        created_at: new Date(delay.created_at),
      };

      return { success: true, delay: formattedDelay };
    } catch (error) {
      console.error('Create task delay error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}

export const taskService = new TaskService();
export default taskService; 