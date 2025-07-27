import { supabase } from '../lib/supabase';
import type { User } from '../types';

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  company?: string;
  phone?: string;
  role: 'project_manager' | 'project_coordinator' | 'subcontractor' | 'supplier' | 'viewer';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

class AuthService {
  /**
   * Sign up a new user with email and password
   */
  async signUp(userData: SignUpData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            company: userData.company,
            phone: userData.phone,
            role: userData.role,
          },
          // Skip email confirmation if disabled in Supabase settings
          emailRedirectTo: undefined
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Check if user is immediately confirmed (email verification disabled)
        if (data.user.email_confirmed_at || !data.user.confirmation_sent_at) {
          // User is confirmed, create user object
          const user: User = {
            id: data.user.id,
            email: userData.email,
            full_name: userData.full_name,
            company: userData.company,
            phone: userData.phone,
            role: userData.role,
            avatar_url: undefined,
            specialties: [],
            created_at: new Date(),
            updated_at: new Date(),
          };

          return { success: true, user };
        } else {
          // Email verification required
          return { 
            success: false, 
            error: 'Please check your email and click the verification link to continue.' 
          };
        }
      }

      return { success: false, error: 'Failed to create user' };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Sign in existing user with email and password
   */
  async signIn(loginData: LoginData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Fetch user profile from our users table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          
          // If profile doesn't exist, create it automatically
          if (profileError.code === 'PGRST116') { // No rows returned
            console.log('Profile not found during signin, creating automatically...');
            
            const newProfile = {
              auth_user_id: data.user.id,
              email: data.user.email || '',
              full_name: data.user.user_metadata?.full_name || data.user.email || 'New User',
              role: (data.user.user_metadata?.role || 'viewer') as any,
              company: data.user.user_metadata?.company || '',
              phone: data.user.user_metadata?.phone || '',
              specialties: [],
            };

            const { data: createdProfile, error: createError } = await supabase
              .from('users')
              .insert(newProfile)
              .select()
              .single();

            if (createError) {
              console.error('Failed to create profile during signin:', createError);
              return { success: false, error: 'Failed to create user profile' };
            }

            const user: User = {
              id: data.user.id,
              email: createdProfile.email,
              full_name: createdProfile.full_name,
              company: createdProfile.company,
              phone: createdProfile.phone,
              role: createdProfile.role,
              avatar_url: createdProfile.avatar_url,
              specialties: createdProfile.specialties || [],
              created_at: new Date(createdProfile.created_at),
              updated_at: new Date(createdProfile.updated_at),
            };

            return { success: true, user };
          }
          
          return { success: false, error: 'Failed to fetch user profile' };
        }

        const user: User = {
          id: data.user.id, // Use auth user ID for consistency
          email: profile.email,
          full_name: profile.full_name,
          company: profile.company,
          phone: profile.phone,
          role: profile.role,
          avatar_url: profile.avatar_url,
          specialties: profile.specialties || [],
          created_at: new Date(profile.created_at),
          updated_at: new Date(profile.updated_at),
        };

        return { success: true, user };
      }

      return { success: false, error: 'Failed to sign in' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get current user session
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return null;
      }

      // Fetch user profile from our users table
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        
        // If profile doesn't exist, create it automatically
        if (error.code === 'PGRST116') { // No rows returned
          console.log('Profile not found, creating automatically...');
          
          const newProfile = {
            auth_user_id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email || 'New User',
            role: (session.user.user_metadata?.role || 'viewer') as any,
            company: session.user.user_metadata?.company || '',
            phone: session.user.user_metadata?.phone || '',
            specialties: [],
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('users')
            .insert(newProfile)
            .select()
            .single();

          if (createError) {
            console.error('Failed to create profile:', createError);
            return null;
          }

          return {
            id: session.user.id,
            email: createdProfile.email,
            full_name: createdProfile.full_name,
            company: createdProfile.company,
            phone: createdProfile.phone,
            role: createdProfile.role,
            avatar_url: createdProfile.avatar_url,
            specialties: createdProfile.specialties || [],
            created_at: new Date(createdProfile.created_at),
            updated_at: new Date(createdProfile.updated_at),
          };
        }
        
        return null;
      }

      return {
        id: session.user.id, // Use auth user ID for consistency  
        email: profile.email,
        full_name: profile.full_name,
        company: profile.company,
        phone: profile.phone,
        role: profile.role,
        avatar_url: profile.avatar_url,
        specialties: profile.specialties || [],
        created_at: new Date(profile.created_at),
        updated_at: new Date(profile.updated_at),
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          full_name: updates.full_name,
          company: updates.company,
          phone: updates.phone,
          avatar_url: updates.avatar_url,
          specialties: updates.specialties,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const user: User = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        company: data.company,
        phone: data.phone,
        role: data.role,
        avatar_url: data.avatar_url,
        specialties: data.specialties || [],
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };

      return { success: true, user };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Change user password
   */
  async changePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Check if user email is verified
   */
  async isEmailVerified(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.email_confirmed_at ? true : false;
    } catch (error) {
      console.error('Email verification check error:', error);
      return false;
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        return { success: false, error: 'No user email found' };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}

export const authService = new AuthService();
export default authService; 