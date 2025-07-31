import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Building, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface InviteData {
  email: string;
  role: string;
  projectId: string;
  projectName: string;
  invitedBy: string;
  expires: number;
}

interface InviteSignupFormProps {
  inviteToken: string;
  onSuccess: () => void;
}

export default function InviteSignupForm({ inviteToken, onSuccess }: InviteSignupFormProps) {
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    password: '',
    confirmPassword: '',
    company: '',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const decoded = JSON.parse(atob(inviteToken)) as InviteData;
      
      // Check if invitation is expired
      if (Date.now() > decoded.expires) {
        setError('This invitation has expired. Please contact the project manager for a new invitation.');
        return;
      }
      
      setInviteData(decoded);
    } catch (error) {
      setError('Invalid invitation link. Please check the URL and try again.');
    }
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData) return;

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Creating account with invitation data:', inviteData);

      // Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: inviteData.role,
            company: formData.company,
            phone: formData.phone
          }
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      console.log('Auth user created:', authData.user);

      // Create user profile in database
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: crypto.randomUUID(),
          auth_user_id: authData.user.id,
          email: inviteData.email,
          full_name: formData.full_name,
          role: inviteData.role,
          company: formData.company,
          phone: formData.phone,
          specialties: [],
          avatar_url: ''
        }]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      console.log('User profile created successfully');

      // Get the created user profile
      const { data: userProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .single();

      if (fetchError || !userProfile) {
        console.error('Error fetching user profile:', fetchError);
        throw new Error('Failed to fetch user profile');
      }

      // Add user to project
      const { error: memberError } = await supabase
        .from('project_members')
        .insert([{
          project_id: inviteData.projectId,
          user_id: userProfile.id,
          role: inviteData.role
        }]);

      if (memberError) {
        console.error('Project member creation error:', memberError);
        throw memberError;
      }

      console.log('User added to project successfully');

      toast.success(`Welcome to ${inviteData.projectName}! Your account has been created.`);
      onSuccess();

    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (error && !inviteData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-red-600">Invalid Invitation</h2>
            <p className="mt-4 text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getRoleName = (role: string) => role.replace('_', ' ').toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Complete Your Invitation
          </h2>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              You've been invited to join <strong>{inviteData.projectName}</strong>
            </p>
            <p className="text-sm text-gray-600">
              as <strong>{getRoleName(inviteData.role)}</strong> by {inviteData.invitedBy}
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  value={inviteData.email}
                  disabled
                  className="input pl-10 bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="label">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  required
                  className="input pl-10"
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Company</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Enter your company name"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="tel"
                  className="input pl-10"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input pl-10 pr-10"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="input pl-10 pr-10"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary"
          >
            {isLoading ? 'Creating Account...' : 'Create Account & Join Project'}
          </button>

          <div className="text-center text-sm text-gray-600">
            <p>
              By creating an account, you'll be automatically added to the project
              <br />
              <strong>{inviteData.projectName}</strong> with <strong>{getRoleName(inviteData.role)}</strong> access.
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}