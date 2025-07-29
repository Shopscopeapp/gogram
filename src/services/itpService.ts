import { supabase } from '../lib/supabase';
import type { ITPTemplate, ITPInstance, ITPRequirement, ITPRequirementInstance } from '../types';

export interface CreateITPTemplateData {
  name: string;
  description?: string;
  category: string;
  type: 'structural' | 'electrical' | 'plumbing' | 'hvac' | 'fire_safety' | 'accessibility' | 'environmental' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  requirements: Omit<ITPRequirement, 'id'>[];
}

export interface UpdateITPTemplateData extends CreateITPTemplateData {
  id: string;
}

export interface CreateITPInstanceData {
  template_id: string;
  task_id: string;
  project_id: string;
  assigned_to?: string;
  due_date?: Date;
}

class ITPService {
  /**
   * Get all ITP templates
   */
  async getITPTemplates(): Promise<{ success: boolean; templates?: ITPTemplate[]; error?: string }> {
    try {
      const { data: templates, error } = await supabase
        .from('itp_templates')
        .select(`
          *,
          itp_requirements (*)
        `)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching ITP templates:', error);
        return { success: false, error: 'Failed to fetch ITP templates' };
      }

      // Transform the data to match our interface
      const transformedTemplates = templates?.map(template => ({
        ...template,
        created_at: new Date(template.created_at),
        updated_at: new Date(template.updated_at),
        requirements: template.itp_requirements?.map((req: any) => ({
          ...req,
          order: req.order_index // Map order_index to order for the interface
        })) || []
      })) || [];

      return { success: true, templates: transformedTemplates };
    } catch (error) {
      console.error('ITP service error:', error);
      return { success: false, error: 'Failed to fetch ITP templates' };
    }
  }

  /**
   * Create a new ITP template
   */
  async createITPTemplate(templateData: CreateITPTemplateData): Promise<{ success: boolean; template?: ITPTemplate; error?: string }> {
    try {
      // Get the current auth user ID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error getting current user:', authError);
        return { success: false, error: 'User not authenticated' };
      }

      // First, create the template
      const { data: template, error: templateError } = await supabase
        .from('itp_templates')
        .insert({
          name: templateData.name,
          description: templateData.description,
          category: templateData.category,
          type: templateData.type,
          priority: templateData.priority,
          is_active: true,
          created_by: user.id,
        })
        .select()
        .single();

      if (templateError) {
        console.error('ITP template creation error:', templateError);
        return { success: false, error: 'Failed to create ITP template' };
      }

      // Then, create the requirements
      if (templateData.requirements.length > 0) {
        const requirements = templateData.requirements.map((req, index) => ({
          template_id: template.id,
          text: req.text,
          required: req.required,
          category: req.category,
          order_index: index + 1,
          notes: req.notes,
        }));

        const { error: reqError } = await supabase
          .from('itp_requirements')
          .insert(requirements);

        if (reqError) {
          console.error('ITP requirements creation error:', reqError);
          // Don't fail the template creation for requirement errors
        }
      }

      // Transform the template to match our interface
      const transformedTemplate = {
        ...template,
        created_at: new Date(template.created_at),
        updated_at: new Date(template.updated_at),
        requirements: templateData.requirements.map(req => ({
          ...req,
          id: '', // This will be set by the database
          order: req.order || 0
        }))
      };

      return { success: true, template: transformedTemplate };
    } catch (error) {
      console.error('ITP service error:', error);
      return { success: false, error: 'Failed to create ITP template' };
    }
  }

  /**
   * Update an existing ITP template
   */
  async updateITPTemplate(templateData: UpdateITPTemplateData): Promise<{ success: boolean; template?: ITPTemplate; error?: string }> {
    try {
      // Get the current auth user ID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error getting current user:', authError);
        return { success: false, error: 'User not authenticated' };
      }

      // First, update the template
      const { data: template, error: templateError } = await supabase
        .from('itp_templates')
        .update({
          name: templateData.name,
          description: templateData.description,
          category: templateData.category,
          type: templateData.type,
          priority: templateData.priority,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateData.id)
        .select()
        .single();

      if (templateError) {
        console.error('ITP template update error:', templateError);
        return { success: false, error: 'Failed to update ITP template' };
      }

      // Delete existing requirements
      const { error: deleteError } = await supabase
        .from('itp_requirements')
        .delete()
        .eq('template_id', templateData.id);

      if (deleteError) {
        console.error('Error deleting existing requirements:', deleteError);
        return { success: false, error: 'Failed to update ITP template requirements' };
      }

      // Then, create the new requirements
      if (templateData.requirements.length > 0) {
        const requirements = templateData.requirements.map((req, index) => ({
          template_id: template.id,
          text: req.text,
          required: req.required,
          category: req.category,
          order_index: index + 1,
          notes: req.notes,
        }));

        const { error: requirementsError } = await supabase
          .from('itp_requirements')
          .insert(requirements);

        if (requirementsError) {
          console.error('ITP requirements creation error:', requirementsError);
          return { success: false, error: 'Failed to update ITP template requirements' };
        }
      }

      // Fetch the updated template with requirements
      const { data: updatedTemplate, error: fetchError } = await supabase
        .from('itp_templates')
        .select(`
          *,
          itp_requirements (*)
        `)
        .eq('id', templateData.id)
        .single();

      if (fetchError) {
        console.error('Error fetching updated template:', fetchError);
        return { success: false, error: 'Failed to fetch updated template' };
      }

      // Transform the data to match our interface
      const transformedTemplate = {
        ...updatedTemplate,
        created_at: new Date(updatedTemplate.created_at),
        updated_at: new Date(updatedTemplate.updated_at),
        requirements: updatedTemplate.itp_requirements?.map((req: any) => ({
          ...req,
          order: req.order_index // Map order_index to order for the interface
        })) || []
      };

      return { success: true, template: transformedTemplate };
    } catch (error) {
      console.error('ITP service error:', error);
      return { success: false, error: 'Failed to update ITP template' };
    }
  }

  /**
   * Get ITP instances for a project
   */
  async getITPInstances(projectId: string): Promise<{ success: boolean; instances?: ITPInstance[]; error?: string }> {
    try {
      const { data: instances, error } = await supabase
        .from('itp_instances')
        .select(`
          *,
          itp_requirement_instances (*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ITP instances:', error);
        return { success: false, error: 'Failed to fetch ITP instances' };
      }

      return { success: true, instances: instances || [] };
    } catch (error) {
      console.error('ITP service error:', error);
      return { success: false, error: 'Failed to fetch ITP instances' };
    }
  }

  /**
   * Create a new ITP instance
   */
  async createITPInstance(instanceData: CreateITPInstanceData): Promise<{ success: boolean; instance?: ITPInstance; error?: string }> {
    try {
      // Get the template to create requirements
      const { data: template, error: templateError } = await supabase
        .from('itp_templates')
        .select(`
          *,
          itp_requirements (*)
        `)
        .eq('id', instanceData.template_id)
        .single();

      if (templateError || !template) {
        console.error('Error fetching ITP template:', templateError);
        return { success: false, error: 'Failed to fetch ITP template' };
      }

      // Create the instance
      const { data: instance, error: instanceError } = await supabase
        .from('itp_instances')
        .insert({
          template_id: instanceData.template_id,
          task_id: instanceData.task_id,
          project_id: instanceData.project_id,
          status: 'pending',
          assigned_to: instanceData.assigned_to,
          due_date: instanceData.due_date?.toISOString(),
        })
        .select()
        .single();

      if (instanceError) {
        console.error('ITP instance creation error:', instanceError);
        return { success: false, error: 'Failed to create ITP instance' };
      }

      // Create requirement instances
      if (template.itp_requirements && template.itp_requirements.length > 0) {
        const requirementInstances = template.itp_requirements.map((req: any) => ({
          instance_id: instance.id,
          requirement_id: req.id,
          text: req.text,
          required: req.required,
          category: req.category,
          order_index: req.order_index,
          completed: false,
        }));

        const { error: reqError } = await supabase
          .from('itp_requirement_instances')
          .insert(requirementInstances);

        if (reqError) {
          console.error('ITP requirement instances creation error:', reqError);
          // Don't fail the instance creation for requirement errors
        }
      }

      return { success: true, instance };
    } catch (error) {
      console.error('ITP service error:', error);
      return { success: false, error: 'Failed to create ITP instance' };
    }
  }

  /**
   * Update ITP instance status
   */
  async updateITPInstanceStatus(instanceId: string, status: ITPInstance['status']): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the current auth user ID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error getting current user:', authError);
        return { success: false, error: 'User not authenticated' };
      }

      const updateData: any = { status };
      
      if (status === 'completed') {
        updateData.completed_by = user.id;
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('itp_instances')
        .update(updateData)
        .eq('id', instanceId);

      if (error) {
        console.error('Error updating ITP instance status:', error);
        return { success: false, error: 'Failed to update ITP instance status' };
      }

      return { success: true };
    } catch (error) {
      console.error('ITP service error:', error);
      return { success: false, error: 'Failed to update ITP instance status' };
    }
  }

  /**
   * Complete a requirement instance
   */
  async completeRequirementInstance(requirementInstanceId: string, notes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the current auth user ID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error getting current user:', authError);
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('itp_requirement_instances')
        .update({
          completed: true,
          completed_by: user.id,
          completed_at: new Date().toISOString(),
          notes,
        })
        .eq('id', requirementInstanceId);

      if (error) {
        console.error('Error completing requirement instance:', error);
        return { success: false, error: 'Failed to complete requirement' };
      }

      return { success: true };
    } catch (error) {
      console.error('ITP service error:', error);
      return { success: false, error: 'Failed to complete requirement' };
    }
  }
}

export const itpService = new ITPService(); 