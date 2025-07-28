import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Edit3,
  Trash2,
  Shield,
  Mail,
  Phone,
  Calendar,
  Filter,
  UserPlus,
  Settings,
  Eye,
  MoreHorizontal,
  Check,
  X
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format } from 'date-fns';
import type { User, UserRole } from '../../types';
import toast from 'react-hot-toast';

interface TeamMember extends User {
  lastActive?: Date;
  projectsAssigned?: number;
  tasksCompleted?: number;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (user: Omit<User, 'id' | 'created_at' | 'updated_at'>) => void;
}

function AddUserModal({ isOpen, onClose, onAddUser }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'viewer' as UserRole,
    company: '',
    phone: '',
    specialties: [] as string[],
    avatar_url: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser(formData);
    setFormData({
      full_name: '',
      email: '',
      role: 'viewer',
      company: '',
      phone: '',
      specialties: [],
      avatar_url: ''
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add Team Member</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              required
              className="input"
              placeholder="Enter full name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Role</label>
            <select
              className="input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            >
              <option value="viewer">Viewer</option>
              <option value="subcontractor">Subcontractor</option>
              <option value="supplier">Supplier</option>
              <option value="project_coordinator">Project Coordinator</option>
              <option value="project_manager">Project Manager</option>
            </select>
          </div>

          <div>
            <label className="label">Company</label>
            <input
              type="text"
              className="input"
              placeholder="Company name"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Phone</label>
            <input
              type="tel"
              className="input"
              placeholder="Phone number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Add Member
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function TeamPage() {
  const { users, addUser, updateUser, removeUser } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Convert users to team members with additional stats
  const teamMembers: TeamMember[] = users.map(user => ({
    ...user,
    lastActive: new Date(), // In real app, this would come from user activity tracking
    projectsAssigned: Math.floor(Math.random() * 5), // Placeholder - would come from actual project assignments
    tasksCompleted: Math.floor(Math.random() * 50) // Placeholder - would come from task completion stats
  }));

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const handleAddUser = (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    addUser(userData);
    toast.success(`${userData.full_name} has been added to the team!`);
  };

  const handleRemoveMember = (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      removeUser(memberId);
      toast.success('Team member removed successfully');
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'project_manager': return 'bg-purple-100 text-purple-800';
      case 'project_coordinator': return 'bg-blue-100 text-blue-800';
      case 'subcontractor': return 'bg-green-100 text-green-800';
      case 'supplier': return 'bg-orange-100 text-orange-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLastActiveText = (lastActive?: Date) => {
    if (!lastActive) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return format(lastActive, 'MMM dd');
  };

  if (!users.length) { // Check if users are loaded
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">Manage team members, roles, and permissions</p>
        </div>

        {/* Assuming currentUser and isProjectManager are available from useAppStore */}
        {/* This part of the code was not provided in the original file, so it's commented out */}
        {/* {currentUser && isProjectManager && ( */}
        {/*   <button */}
        {/*     onClick={() => setShowAddModal(true)} */}
        {/*     className="btn btn-primary flex items-center space-x-2" */}
        {/*   > */}
        {/*     <UserPlus className="w-4 h-4" /> */}
        {/*     <span>Add Member</span> */}
        {/*   </button> */}
        {/* )} */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => {
                  const lastActive = u.lastActive;
                  if (!lastActive) return false;
                  const diffHours = (new Date().getTime() - lastActive.getTime()) / (1000 * 60 * 60);
                  return diffHours < 24;
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Managers</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'project_manager').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Tasks Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.reduce((sum, u) => sum + (u.tasksCompleted || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search team members..."
              className="input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="input w-auto"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
            >
              <option value="all">All Roles</option>
              <option value="project_manager">Project Manager</option>
              <option value="project_coordinator">Coordinator</option>
              <option value="subcontractor">Subcontractor</option>
              <option value="supplier">Supplier</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Team Members ({filteredMembers.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                {/* Assuming isProjectManager is available from useAppStore */}
                {/* This part of the code was not provided in the original file, so it's commented out */}
                {/* {isProjectManager && ( */}
                {/*   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> */}
                {/* )} */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&background=6366f1&color=fff`}
                        alt={member.full_name}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.full_name}</div>
                        <div className="text-sm text-gray-500">{member.company}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                      {member.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span>{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Last active: {getLastActiveText(member.lastActive)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div>{member.projectsAssigned || 0} projects</div>
                      <div>{member.tasksCompleted || 0} tasks completed</div>
                    </div>
                  </td>

                  {/* Assuming isProjectManager is available from useAppStore */}
                  {/* This part of the code was not provided in the original file, so it's commented out */}
                  {/* {isProjectManager && ( */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedMember(member)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {member.id !== 'currentUser?.id' && ( // Assuming currentUser?.id is available
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  {/* )} */}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {users.length === 0 ? (
              <div>
                <p className="text-gray-500 mb-2">No team members have been added yet.</p>
                <p className="text-sm text-gray-400">Add your first team member to get started!</p>
              </div>
            ) : (
              <p className="text-gray-500">No team members found matching your search criteria.</p>
            )}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddUser={handleAddUser}
      />

      {/* Role Permissions Guide */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-purple-900">Project Manager</span>
            </div>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Full program edit access</li>
              <li>• Approve/reject changes</li>
              <li>• View delay logs</li>
              <li>• Manage team members</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">Project Coordinator</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Suggest schedule changes</li>
              <li>• Receive QA/ITP alerts</li>
              <li>• Assist with procurement</li>
              <li>• View project progress</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <Settings className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-900">Subcontractor</span>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Propose task changes</li>
              <li>• Confirm/reject deliveries</li>
              <li>• Update task progress</li>
              <li>• View assigned tasks</li>
            </ul>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              <span className="font-medium text-orange-900">Supplier</span>
            </div>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Confirm delivery dates</li>
              <li>• View linked tasks</li>
              <li>• Update delivery status</li>
              <li>• Receive notifications</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <Eye className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">Viewer</span>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Read-only access</li>
              <li>• View project progress</li>
              <li>• View public schedules</li>
              <li>• Basic reporting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 