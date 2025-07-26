import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../database/types';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vcjotjqqbldtibajujac.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjam90anFxYmxkdGliYWp1amFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MTU0ODksImV4cCI6MjA2OTA5MTQ4OX0.0w1IJW2ED88tpmBEIYpNz24e5oCsCwaGUphv9ijFeQU';

// Create Supabase client with TypeScript support
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper functions for common database operations
export class SupabaseService {
  // User operations
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    // Get the user profile from the users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    return profile;
  }

  // Project operations
  static async getProjectWithMembers(projectId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_members (
          user_id,
          role,
          users (*)
        )
      `)
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      return null;
    }

    return data;
  }

  // Task operations
  static async getProjectTasks(projectId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        task_dependencies (
          dependency_id,
          dependency_type
        ),
        task_delays (*),
        users!assigned_to (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('project_id', projectId)
      .order('start_date');

    if (error) {
      console.error('Error fetching tasks:', error);
      return null;
    }

    return data;
  }

  static async createTask(task: Database['public']['Tables']['tasks']['Insert']) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }

    return data;
  }

  static async updateTask(taskId: string, updates: Database['public']['Tables']['tasks']['Update']) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }

    return data;
  }

  static async deleteTask(taskId: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // Supplier operations
  static async getSuppliers() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching suppliers:', error);
      return null;
    }

    return data;
  }

  // Delivery operations
  static async getProjectDeliveries(projectId: string) {
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        suppliers (*),
        tasks (
          id,
          title,
          project_id
        )
      `)
      .eq('project_id', projectId)
      .order('planned_date');

    if (error) {
      console.error('Error fetching deliveries:', error);
      return null;
    }

    return data;
  }

  static async updateDelivery(deliveryId: string, updates: Database['public']['Tables']['deliveries']['Update']) {
    const { data, error } = await supabase
      .from('deliveries')
      .update(updates)
      .eq('id', deliveryId)
      .select()
      .single();

    if (error) {
      console.error('Error updating delivery:', error);
      throw error;
    }

    return data;
  }

  // Task Change Proposals
  static async getTaskChangeProposals(projectId: string) {
    const { data, error } = await supabase
      .from('task_change_proposals')
      .select(`
        *,
        tasks (
          id,
          title,
          project_id
        ),
        users!proposed_by (
          id,
          full_name,
          email
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching task change proposals:', error);
      return null;
    }

    return data;
  }

  // QA Alerts
  static async getProjectQAAlerts(projectId: string) {
    const { data, error } = await supabase
      .from('qa_alerts')
      .select(`
        *,
        tasks (
          id,
          title,
          project_id
        )
      `)
      .eq('project_id', projectId)
      .order('due_date');

    if (error) {
      console.error('Error fetching QA alerts:', error);
      return null;
    }

    return data;
  }

  // Real-time subscriptions
  static subscribeToProjectUpdates(projectId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel('project-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `project_id=eq.${projectId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_change_proposals',
          filter: `project_id=eq.${projectId}`
        },
        callback
      )
      .subscribe();

    return channel;
  }

  // Authentication helpers
  static async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Error signing in:', error);
      throw error;
    }

    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  static async signUp(email: string, password: string, userData: {
    full_name: string;
    company?: string;
    phone?: string;
    role: string;
  }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });

    if (error) {
      console.error('Error signing up:', error);
      throw error;
    }

    return data;
  }
}

export default supabase; 