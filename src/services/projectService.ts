import { supabase } from '../lib/supabase';
import type { Project, User } from '../types';

export interface CreateProjectData {
  title: string;
  description?: string;
  client?: string;
  location?: string;
  start_date: Date;
  end_date: Date;
  budget?: number;
}

export interface ProjectMember {
  user_id: string;
  project_id: string;
  role: 'owner' | 'manager' | 'coordinator' | 'member' | 'viewer';
  joined_at: Date;
  user?: User;
}

export interface ProjectInvitation {
  id: string;
  project_id: string;
  email: string;
  role: ProjectMember['role'];
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: Date;
  expires_at: Date;
  project?: Project;
  invited_by_user?: User;
}

interface ProjectListResponse {
  success: boolean;
  projects?: Project[];
  error?: string;
}

class ProjectService {
  /**
   * Create a new construction project
   */
  async createProject(projectData: CreateProjectData, userId: string): Promise<{ success: boolean; project?: Project; error?: string }> {
    try {
      // First, get the correct user ID from public.users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (userError || !user) {
        console.error('User lookup error:', userError);
        return { success: false, error: 'User not found' };
      }

      // Create the project using the public.users.id
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectData.title, // Map title to name in database
          description: projectData.description,
          client: projectData.client,
          location: projectData.location,
          start_date: projectData.start_date.toISOString(),
          end_date: projectData.end_date.toISOString(),
          budget: projectData.budget,
          project_manager_id: user.id, // Use the public.users.id instead of auth user ID
          status: 'planning',
          progress_percentage: 0,
        })
        .select()
        .single();

      if (projectError) {
        console.error('Project creation error:', projectError);
        return { success: false, error: 'Failed to create project' };
      }

      // Now manually add the creator as a project member
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: project.id,
          user_id: user.id,
          role: 'project_manager',
        })
        .select();

      if (memberError) {
        console.error('Project member creation error:', memberError);
        // Don't fail the whole operation, just log it
      }

      const formattedProject: Project = {
        id: project.id,
        name: project.name, // Use name field from database
        description: project.description,
        client: project.client,
        location: project.location,
        start_date: new Date(project.start_date),
        end_date: new Date(project.end_date),
        budget: project.budget,
        progress_percentage: project.progress_percentage,
        status: project.status,
        project_manager_id: project.project_manager_id,
        created_at: new Date(project.created_at),
        updated_at: new Date(project.updated_at),
      };

      return { success: true, project: formattedProject };
    } catch (error) {
      console.error('Create project error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get all projects for a user
   */
  async getUserProjects(userId: string): Promise<ProjectListResponse> {
    try {
      // First, get the correct user ID from public.users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (userError || !user) {
        console.error('User lookup error:', userError);
        return { success: false, error: 'User not found' };
      }

      const { data: projectMembers, error } = await supabase
        .from('project_members')
        .select(`
          role,
          projects (
            id,
            name,
            description,
            client,
            location,
            start_date,
            end_date,
            budget,
            progress_percentage,
            status,
            project_manager_id,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id); // Use the public.users.id

      if (error) {
        console.error('Get user projects error:', error);
        return { success: false, error: 'Failed to fetch projects' };
      }

      const projects: Project[] = projectMembers
        .filter(member => member.projects)
        .map(member => {
          const project = member.projects as any; // Type assertion for debugging
          return {
            id: project.id,
            name: project.name, // Use name instead of title
            description: project.description,
            client: project.client,
            location: project.location,
            start_date: new Date(project.start_date),
            end_date: new Date(project.end_date),
            budget: project.budget,
            progress_percentage: project.progress_percentage,
            status: project.status,
            project_manager_id: project.project_manager_id,
            created_at: new Date(project.created_at),
            updated_at: new Date(project.updated_at),
          };
        });

      return { success: true, projects };
    } catch (error) {
      console.error('Get user projects error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get a specific project with team members
   */
  async getProject(projectId: string, userId: string): Promise<{ success: boolean; project?: Project; members?: ProjectMember[]; error?: string }> {
    try {
      // Check if user has access to this project
      const { data: memberCheck } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single();

      if (!memberCheck) {
        return { success: false, error: 'You do not have access to this project' };
      }

      // Get project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Get project error:', projectError);
        return { success: false, error: 'Failed to fetch project' };
      }

      // Get project members
      const { data: members, error: membersError } = await supabase
        .from('project_members')
        .select(`
          user_id,
          project_id,
          role,
          joined_at,
          users (
            id,
            email,
            full_name,
            role,
            avatar_url,
            company,
            phone,
            specialties
          )
        `)
        .eq('project_id', projectId);

      if (membersError) {
        console.error('Get project members error:', membersError);
        return { success: false, error: 'Failed to fetch project members' };
      }

      const formattedProject: Project = {
        id: project.id,
        title: project.title,
        description: project.description,
        client: project.client,
        location: project.location,
        start_date: new Date(project.start_date),
        end_date: new Date(project.end_date),
        budget: project.budget,
        progress_percentage: project.progress_percentage,
        is_public: project.is_public,
        public_share_token: project.public_share_token,
        public_settings: project.public_settings,
        created_by: project.created_by,
        created_at: new Date(project.created_at),
        updated_at: new Date(project.updated_at),
      };

      const formattedMembers: ProjectMember[] = members.map(member => ({
        user_id: member.user_id,
        project_id: member.project_id,
        role: member.role,
        joined_at: new Date(member.joined_at),
        user: member.users ? {
          id: member.users.id,
          email: member.users.email,
          full_name: member.users.full_name,
          role: member.users.role,
          avatar_url: member.users.avatar_url,
          company: member.users.company,
          phone: member.users.phone,
          specialties: member.users.specialties || [],
          created_at: new Date(),
          updated_at: new Date(),
        } : undefined,
      }));

      return { success: true, project: formattedProject, members: formattedMembers };
    } catch (error) {
      console.error('Get project error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Update project details
   */
  async updateProject(projectId: string, userId: string, updates: Partial<CreateProjectData>): Promise<{ success: boolean; project?: Project; error?: string }> {
    try {
      // Check if user has permission to update project
      const { data: memberCheck } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single();

      if (!memberCheck || !['owner', 'manager'].includes(memberCheck.role)) {
        return { success: false, error: 'You do not have permission to update this project' };
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.client !== undefined) updateData.client = updates.client;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.start_date) updateData.start_date = updates.start_date.toISOString();
      if (updates.end_date) updateData.end_date = updates.end_date.toISOString();
      if (updates.budget !== undefined) updateData.budget = updates.budget;

      const { data: project, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)
        .select()
        .single();

      if (error) {
        console.error('Update project error:', error);
        return { success: false, error: 'Failed to update project' };
      }

      const formattedProject: Project = {
        id: project.id,
        title: project.title,
        description: project.description,
        client: project.client,
        location: project.location,
        start_date: new Date(project.start_date),
        end_date: new Date(project.end_date),
        budget: project.budget,
        progress_percentage: project.progress_percentage,
        is_public: project.is_public,
        public_share_token: project.public_share_token,
        public_settings: project.public_settings,
        created_by: project.created_by,
        created_at: new Date(project.created_at),
        updated_at: new Date(project.updated_at),
      };

      return { success: true, project: formattedProject };
    } catch (error) {
      console.error('Update project error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Delete a project (owner only)
   */
  async deleteProject(projectId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user is project owner
      const { data: memberCheck } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single();

      if (!memberCheck || memberCheck.role !== 'owner') {
        return { success: false, error: 'Only project owners can delete projects' };
      }

      // Delete the project (cascading deletes will handle related records)
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.error('Delete project error:', error);
        return { success: false, error: 'Failed to delete project' };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete project error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Invite user to project
   */
  async inviteUserToProject(
    projectId: string,
    email: string,
    role: ProjectMember['role'],
    invitedBy: string
  ): Promise<{ success: boolean; invitation?: ProjectInvitation; error?: string }> {
    try {
      // Check if inviter has permission
      const { data: memberCheck } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', invitedBy)
        .single();

      if (!memberCheck || !['owner', 'manager'].includes(memberCheck.role)) {
        return { success: false, error: 'You do not have permission to invite users' };
      }

      // Check if user is already a member
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        const { data: existingMember } = await supabase
          .from('project_members')
          .select()
          .eq('project_id', projectId)
          .eq('user_id', existingUser.id)
          .single();

        if (existingMember) {
          return { success: false, error: 'User is already a member of this project' };
        }
      }

      // Create invitation
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { data: invitation, error } = await supabase
        .from('project_invitations')
        .insert({
          project_id: projectId,
          email: email.toLowerCase(),
          role,
          invited_by: invitedBy,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Create invitation error:', error);
        return { success: false, error: 'Failed to create invitation' };
      }

      const formattedInvitation: ProjectInvitation = {
        id: invitation.id,
        project_id: invitation.project_id,
        email: invitation.email,
        role: invitation.role,
        invited_by: invitation.invited_by,
        status: invitation.status,
        created_at: new Date(invitation.created_at),
        expires_at: new Date(invitation.expires_at),
      };

      // TODO: Send invitation email

      return { success: true, invitation: formattedInvitation };
    } catch (error) {
      console.error('Invite user error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Accept project invitation
   */
  async acceptInvitation(invitationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get invitation details
      const { data: invitation, error: inviteError } = await supabase
        .from('project_invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invitation) {
        return { success: false, error: 'Invitation not found or already processed' };
      }

      // Check if invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        return { success: false, error: 'Invitation has expired' };
      }

      // Get user email to verify invitation
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        return { success: false, error: 'This invitation is not for your email address' };
      }

      // Add user to project
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: invitation.project_id,
          user_id: userId,
          role: invitation.role,
        });

      if (memberError) {
        console.error('Add project member error:', memberError);
        return { success: false, error: 'Failed to join project' };
      }

      // Update invitation status
      await supabase
        .from('project_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      return { success: true };
    } catch (error) {
      console.error('Accept invitation error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Leave project
   */
  async leaveProject(projectId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user is project owner
      const { data: memberCheck } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single();

      if (!memberCheck) {
        return { success: false, error: 'You are not a member of this project' };
      }

      if (memberCheck.role === 'owner') {
        return { success: false, error: 'Project owners cannot leave their projects. Transfer ownership first.' };
      }

      // Remove user from project
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) {
        console.error('Leave project error:', error);
        return { success: false, error: 'Failed to leave project' };
      }

      return { success: true };
    } catch (error) {
      console.error('Leave project error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}

export const projectService = new ProjectService();
export default projectService; 