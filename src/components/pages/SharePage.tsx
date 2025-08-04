import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Share2, 
  Copy, 
  Eye, 
  Settings, 
  Plus,
  ExternalLink,
  BarChart3,
  Calendar,
  Users,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Globe
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format, parseISO } from 'date-fns';
import publicSharingService, { type PublicShareSettings } from '../../services/publicSharingService';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

// Safe date formatting helper
const safeDateFormat = (date: any, formatStr: string): string => {
  if (!date) return 'N/A';
  try {
    if (date instanceof Date) {
      return isNaN(date.getTime()) ? 'Invalid date' : format(date, formatStr);
    }
    if (typeof date === 'string') {
      const parsed = parseISO(date);
      return isNaN(parsed.getTime()) ? 'Invalid date' : format(parsed, formatStr);
    }
    return 'Invalid date';
  } catch (error) {
    console.warn('Date formatting error:', error, 'Date:', date);
    return 'Invalid date';
  }
};

interface ShareLinkCardProps {
  shareLink: PublicShareSettings;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onUpdateSettings: (id: string, settings: Partial<PublicShareSettings['settings']>) => void;
  onDelete: (id: string) => void;
}

function ShareLinkCard({ shareLink, onToggleStatus, onUpdateSettings, onDelete }: ShareLinkCardProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(shareLink.settings);

  const publicUrl = publicSharingService.generatePublicUrl(shareLink.shareToken);
  const analytics = publicSharingService.getShareAnalytics(shareLink);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleSettingsUpdate = () => {
    onUpdateSettings(shareLink.id, settings);
    setShowSettings(false);
    toast.success('Share settings updated!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card hover:shadow-lg transition-shadow duration-200"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              shareLink.isActive ? 'bg-success-100' : 'bg-gray-100'
            }`}>
              <Globe className={`w-6 h-6 ${
                shareLink.isActive ? 'text-success-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Public Project Link</h3>
              <p className="text-sm text-gray-600 mt-1">
                Created {safeDateFormat(shareLink.createdAt, 'MMM dd, yyyy')}
              </p>
              <p className="text-xs text-gray-500">
                Expires {safeDateFormat(shareLink.expiresAt, 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleStatus(shareLink.id, !shareLink.isActive)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                shareLink.isActive
                  ? 'bg-success-100 text-success-700 hover:bg-success-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {shareLink.isActive ? 'Active' : 'Inactive'}
            </button>
          </div>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{analytics.totalViews}</div>
            <div className="text-xs text-gray-600">Total Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success-600">{analytics.uniqueVisitors}</div>
            <div className="text-xs text-gray-600">Unique Visitors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning-600">{analytics.recentViews}</div>
            <div className="text-xs text-gray-600">Recent Views</div>
          </div>
        </div>

        {/* Share URL */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 mb-1">Share URL:</p>
              <p className="text-sm font-mono text-gray-900 truncate">{publicUrl}</p>
            </div>
            <div className="flex items-center space-x-2 ml-3">
              <button
                onClick={copyToClipboard}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-gray-200 pt-4 space-y-4"
          >
            <h4 className="font-medium text-gray-900">Share Settings</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showTaskDetails}
                  onChange={(e) => setSettings(prev => ({ ...prev, showTaskDetails: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Task Details</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showProgress}
                  onChange={(e) => setSettings(prev => ({ ...prev, showProgress: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Progress</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showMilestones}
                  onChange={(e) => setSettings(prev => ({ ...prev, showMilestones: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Milestones</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showDelays}
                  onChange={(e) => setSettings(prev => ({ ...prev, showDelays: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Delays</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showTeamMembers}
                  onChange={(e) => setSettings(prev => ({ ...prev, showTeamMembers: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Team Members</span>
              </label>

              <div className="text-sm text-gray-500">
                <Shield className="w-4 h-4 inline mr-1" />
                Procurement & Financials Hidden
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <button
                onClick={() => onDelete(shareLink.id)}
                className="text-sm text-danger-600 hover:text-danger-700 font-medium"
              >
                Delete Link
              </button>
              <button
                onClick={handleSettingsUpdate}
                className="btn btn-primary btn-sm"
              >
                Update Settings
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function SharePage() {
  const { 
    currentUser, 
    currentProject, 
    tasks,
    isProjectManager 
  } = useAppStore();

  const [publicShares, setPublicShares] = useState<PublicShareSettings[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newShareSettings, setNewShareSettings] = useState({
    showTaskDetails: true,
    showTeamMembers: false,
    showProgress: true,
    showMilestones: true,
    showDelays: false,
    expirationDays: 0 // 0 = no expiration
  });

  if (!currentUser || !currentProject) {
    return <div>Loading...</div>;
  }

  if (!isProjectManager()) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">
            Only Project Managers can create and manage public project links.
          </p>
        </div>
      </div>
    );
  }

  const handleCreateShare = async () => {
    if (!currentUser || !currentProject) return;

    try {
      const expiresAt = newShareSettings.expirationDays > 0 
        ? new Date(Date.now() + newShareSettings.expirationDays * 24 * 60 * 60 * 1000)
        : null;

      // Generate a secure share token
      const shareToken = btoa(currentProject.id + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9));

      const shareSettings = {
        showTaskDetails: newShareSettings.showTaskDetails,
        showTeamMembers: newShareSettings.showTeamMembers,
        showProgress: newShareSettings.showProgress,
        showMilestones: newShareSettings.showMilestones,
        showDelays: newShareSettings.showDelays,
        hideProcurement: true,
        hideFinancials: true,
        hideInternalNotes: true,
        allowedSections: ['overview', 'schedule', 'progress', 'milestones']
      };

      // Save to database
      const { data, error } = await supabase
        .from('public_shares')
        .insert({
          project_id: currentProject.id,
          share_token: shareToken,
          created_by: currentUser.id,
          expires_at: expiresAt,
          is_active: true,
          settings: shareSettings
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating share link:', error);
        toast.error('Failed to create share link. Please try again.');
        return;
      }

      // Create the share object for local state
      const newShare = {
        id: data.id,
        projectId: currentProject.id,
        shareToken: shareToken,
        createdBy: currentUser.id,
        createdAt: new Date(data.created_at),
        expiresAt: expiresAt || undefined,
        isActive: true,
        settings: shareSettings,
        accessLog: []
      };

      setPublicShares(prev => [newShare, ...prev]);
      setShowCreateForm(false);
      
      // Reset form
      setNewShareSettings({
        showTaskDetails: true,
        showTeamMembers: false,
        showProgress: true,
        showMilestones: true,
        showDelays: false,
        expirationDays: 0
      });

      toast.success('Public share link created successfully!');
    } catch (error) {
      console.error('Error creating share link:', error);
      toast.error('Failed to create share link. Please try again.');
    }
  };

  const handleToggleStatus = (id: string, isActive: boolean) => {
    setPublicShares(prev => 
      prev.map(share => 
        share.id === id ? { ...share, isActive } : share
      )
    );
    toast.success(`Share link ${isActive ? 'activated' : 'deactivated'}`);
  };

  const handleUpdateSettings = (id: string, newSettings: Partial<PublicShareSettings['settings']>) => {
    setPublicShares(prev => 
      prev.map(share => 
        share.id === id 
          ? { ...share, settings: { ...share.settings, ...newSettings } }
          : share
      )
    );
  };

  const handleDeleteShare = (id: string) => {
    setPublicShares(prev => prev.filter(share => share.id !== id));
    toast.success('Share link deleted');
  };

  // Calculate project stats for preview
  const projectStats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    upcomingMilestones: tasks.filter(t => 
      t.priority === 'critical' && t.status !== 'completed'
    ).length,
    overallProgress: Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Share Project</h1>
          <p className="text-gray-600 mt-1">
            Create public links for external stakeholders to view project progress
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary btn-md flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Share Link</span>
          </button>
        </div>
      </div>

      {/* Project Preview */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Project Overview</h2>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">{currentProject.name}</h3>
              <p className="text-gray-600 mb-4">{currentProject.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Start Date:</span>
                  <span>{safeDateFormat(currentProject.start_date, 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">End Date:</span>
                  <span>{safeDateFormat(currentProject.end_date, 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="capitalize">{currentProject.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary-50 rounded-lg">
                <div className="text-2xl font-bold text-primary-600">{projectStats.totalTasks}</div>
                <div className="text-sm text-gray-600">Total Tasks</div>
              </div>
              <div className="text-center p-4 bg-success-50 rounded-lg">
                <div className="text-2xl font-bold text-success-600">{projectStats.completedTasks}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-warning-50 rounded-lg">
                <div className="text-2xl font-bold text-warning-600">{projectStats.upcomingMilestones}</div>
                <div className="text-sm text-gray-600">Milestones</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{projectStats.overallProgress}%</div>
                <div className="text-sm text-gray-600">Progress</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Share Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Create Public Share Link</h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Share Settings */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Visibility Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newShareSettings.showTaskDetails}
                    onChange={(e) => setNewShareSettings(prev => ({ ...prev, showTaskDetails: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Task Details</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newShareSettings.showProgress}
                    onChange={(e) => setNewShareSettings(prev => ({ ...prev, showProgress: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Progress Charts</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newShareSettings.showMilestones}
                    onChange={(e) => setNewShareSettings(prev => ({ ...prev, showMilestones: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Milestones</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newShareSettings.showDelays}
                    onChange={(e) => setNewShareSettings(prev => ({ ...prev, showDelays: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Delays</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newShareSettings.showTeamMembers}
                    onChange={(e) => setNewShareSettings(prev => ({ ...prev, showTeamMembers: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Team Members</span>
                </label>

                <div className="text-sm text-gray-500 flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  Procurement & Financials Always Hidden
                </div>
              </div>
            </div>

            {/* Expiration Settings */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Link Expiration</h3>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="expiration"
                    checked={newShareSettings.expirationDays === 0}
                    onChange={() => setNewShareSettings(prev => ({ ...prev, expirationDays: 0 }))}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Never expires</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="expiration"
                    checked={newShareSettings.expirationDays === 30}
                    onChange={() => setNewShareSettings(prev => ({ ...prev, expirationDays: 30 }))}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">30 days</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="expiration"
                    checked={newShareSettings.expirationDays === 90}
                    onChange={() => setNewShareSettings(prev => ({ ...prev, expirationDays: 90 }))}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">90 days</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateShare}
                className="btn btn-primary btn-md flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Create Share Link</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Existing Share Links */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Active Share Links</h2>
        {publicShares.length > 0 ? (
          <div className="space-y-4">
            {publicShares.map(shareLink => (
              <ShareLinkCard
                key={shareLink.id}
                shareLink={shareLink}
                onToggleStatus={handleToggleStatus}
                onUpdateSettings={handleUpdateSettings}
                onDelete={handleDeleteShare}
              />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Share Links Created</h3>
            <p className="text-gray-600 mb-4">
              Create your first public share link to allow external stakeholders to view project progress.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary btn-md"
            >
              Create Share Link
            </button>
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
        <h3 className="font-medium text-primary-900 mb-2">🔒 Security & Privacy</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-primary-800">
          <div>
            <strong>Automatically Hidden:</strong> All procurement details, financial information, internal notes, and supplier contacts are never visible to public viewers.
          </div>
          <div>
            <strong>Access Control:</strong> Each link has a unique secure token and can be deactivated or deleted at any time.
          </div>
          <div>
            <strong>Analytics:</strong> Track who views your project and which sections they're most interested in.
          </div>
          <div>
            <strong>Real-time Updates:</strong> Public viewers see live project progress as you update tasks and milestones.
          </div>
        </div>
      </div>
    </div>
  );
} 