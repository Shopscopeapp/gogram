import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import InviteSignupForm from '../auth/InviteSignupForm';

export default function InvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

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

  return <InviteSignupForm inviteToken={token} onSuccess={handleSuccess} />;
}