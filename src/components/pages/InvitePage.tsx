import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { authService } from '../../services/authService';
import { useAppStore } from '../../store';
import { toast } from 'react-hot-toast';
import InviteSignupForm from '../auth/InviteSignupForm';

interface InviteData {
  email: string;
  role: string;
  projectId: string;
  projectName: string;
  invitedBy: string;
  expires: number;
}

export default function InvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [isProcessing, setIsProcessing] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { setCurrentUser: setStoreUser, setCurrentProject, loadProjects } = useAppStore();

  // Check for existing authentication and process invitation
  useEffect(() => {
    const processInvitation = async () => {
      if (!token) return;

      try {
        // Parse the invitation token
        const decoded = JSON.parse(atob(token)) as InviteData;
        
        // Check if invitation is expired
        if (Date.now() > decoded.expires) {
          toast.error('This invitation has expired. Please contact the project manager for a new invitation.');
          navigate('/');
          return;
        }

        setInviteData(decoded);

        // Check if user is already authenticated
        const user = await authService.getCurrentUser();
        
        if (user) {
          console.log('Existing authenticated user found:', user.email);
          setCurrentUser(user);
          
          // Check if this is the same email as the invitation
          if (user.email === decoded.email) {
            await handleExistingUserInvitation(user, decoded);
          } else {
            // Different email - show warning and allow user to decide
            toast.error(`You're logged in as ${user.email}, but this invitation is for ${decoded.email}. Please log out and try again.`);
            navigate('/');
          }
        }
        // If no user is authenticated, the InviteSignupForm will handle new user creation
        
      } catch (error) {
        console.error('Error processing invitation:', error);
        toast.error('Invalid invitation link. Please check the URL and try again.');
        navigate('/');
      }
    };

    processInvitation();
  }, [token, navigate]);

  // Handle existing authenticated user invitation
  const handleExistingUserInvitation = async (user: any, invite: InviteData) => {
    setIsProcessing(true);
    
    try {
      console.log('Adding existing user to project:', invite.projectName);

      // Get the user's profile from the database
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      // Check if user is already a member of this project
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', invite.projectId)
        .eq('user_id', userProfile.id)
        .single();

      if (memberCheckError && memberCheckError.code !== 'PGRST116') {
        console.error('Error checking existing membership:', memberCheckError);
        throw memberCheckError;
      }

      if (existingMember) {
        // User is already a member - update their role if different
        if (existingMember.role !== invite.role) {
          const { error: updateError } = await supabase
            .from('project_members')
            .update({ role: invite.role })
            .eq('id', existingMember.id);

          if (updateError) {
            console.error('Error updating user role:', updateError);
            throw updateError;
          }

          toast.success(`Your role in "${invite.projectName}" has been updated to ${invite.role.replace('_', ' ').toUpperCase()}!`);
        } else {
          toast.success(`You're already a member of "${invite.projectName}" with the role ${invite.role.replace('_', ' ').toUpperCase()}!`);
        }
      } else {
        // Add user to the project
        const { error: memberError } = await supabase
          .from('project_members')
          .insert([{
            project_id: invite.projectId,
            user_id: userProfile.id,
            role: invite.role
          }]);

        if (memberError) {
          console.error('Error adding user to project:', memberError);
          throw memberError;
        }

        toast.success(`You've been added to "${invite.projectName}" as ${invite.role.replace('_', ' ').toUpperCase()}!`);
      }

      // Refresh user's projects and navigate to the project
      await loadProjects();
      
      // Navigate to the specific project
      navigate(`/?project=${invite.projectId}`, { replace: true });

    } catch (error: any) {
      console.error('Error processing existing user invitation:', error);
      toast.error(error.message || 'Failed to process invitation. Please try again.');
      navigate('/');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-red-600">Invalid Invitation</h2>
            <p className="mt-4 text-gray-600">
              No invitation token found. Please check your invitation link and try again.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 btn btn-primary"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSuccess = () => {
    // Redirect to login page after successful signup
    navigate('/auth?mode=login', { 
      state: { message: 'Account created successfully! Please log in to access your project.' }
    });
  };

  // Show loading state while processing existing user
  if (isProcessing || (currentUser && inviteData)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentUser ? 'Adding you to the project...' : 'Processing invitation...'}
            </h2>
            <p className="text-gray-600">
              {inviteData ? `Adding you to "${inviteData.projectName}"` : 'Please wait...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show signup form for new users (when no current user is authenticated)
  if (!currentUser && inviteData) {
    return <InviteSignupForm inviteToken={token} onSuccess={handleSuccess} />;
  }

  // Default loading state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}