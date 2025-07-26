import type { Project, Task, User } from '../types';
import { format, differenceInDays } from 'date-fns';

interface PublicShareSettings {
  id: string;
  projectId: string;
  shareToken: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  settings: {
    showTaskDetails: boolean;
    showTeamMembers: boolean;
    showProgress: boolean;
    showMilestones: boolean;
    showDelays: boolean;
    hideProcurement: boolean;
    hideFinancials: boolean;
    hideInternalNotes: boolean;
    allowedSections: string[];
  };
  accessLog: Array<{
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    viewedSections: string[];
  }>;
}

interface PublicProjectView {
  project: {
    id: string;
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    status: string;
    progress: number;
  };
  tasks: PublicTask[];
  milestones: PublicTask[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
    onScheduleTasks: number;
    upcomingDeadlines: number;
  };
  timeline: {
    phases: Array<{
      name: string;
      startDate: Date;
      endDate: Date;
      status: string;
      progress: number;
    }>;
  };
  lastUpdated: Date;
}

interface PublicTask {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  color: string;
  // Sensitive fields are omitted: assignedTo, cost, suppliers, procurement details
}

class PublicSharingService {
  private readonly baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gogram.app';

  /**
   * Generate a new public share link
   */
  public generatePublicShare(
    project: Project,
    createdBy: string,
    settings: Partial<PublicShareSettings['settings']> = {}
  ): PublicShareSettings {
    const shareToken = this.generateSecureToken();
    const defaultSettings: PublicShareSettings['settings'] = {
      showTaskDetails: true,
      showTeamMembers: false,
      showProgress: true,
      showMilestones: true,
      showDelays: false, // Hide delays by default for external view
      hideProcurement: true, // Always hide procurement from public
      hideFinancials: true, // Always hide financials from public
      hideInternalNotes: true, // Always hide internal notes from public
      allowedSections: ['overview', 'schedule', 'progress', 'milestones']
    };

    return {
      id: `share-${Date.now()}`,
      projectId: project.id,
      shareToken,
      createdBy,
      createdAt: new Date(),
      expiresAt: undefined, // No expiration by default
      isActive: true,
      settings: { ...defaultSettings, ...settings },
      accessLog: []
    };
  }

  /**
   * Generate secure token for public sharing
   */
  private generateSecureToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Create public project view with filtered data
   */
  public createPublicProjectView(
    project: Project,
    tasks: Task[],
    shareSettings: PublicShareSettings
  ): PublicProjectView {
    // Filter tasks based on settings
    const publicTasks = this.filterTasksForPublic(tasks, shareSettings.settings);
    
    // Get milestones (high priority tasks or those marked as milestones)
    const milestones = publicTasks.filter(task => 
      task.priority === 'critical' || task.category === 'Milestone'
    );

    // Calculate stats
    const completedTasks = publicTasks.filter(t => t.status === 'completed').length;
    const upcomingTasks = publicTasks.filter(t => {
      const daysUntilDeadline = differenceInDays(t.endDate, new Date());
      return daysUntilDeadline <= 7 && daysUntilDeadline > 0;
    }).length;

    // Create project phases for timeline
    const phases = this.generateProjectPhases(publicTasks);

    return {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
        progress: Math.round((completedTasks / publicTasks.length) * 100)
      },
      tasks: publicTasks,
      milestones,
      stats: {
        totalTasks: publicTasks.length,
        completedTasks,
        completionPercentage: Math.round((completedTasks / publicTasks.length) * 100),
        onScheduleTasks: publicTasks.filter(t => t.status !== 'completed' && t.status !== 'delayed').length,
        upcomingDeadlines: upcomingTasks
      },
      timeline: {
        phases
      },
      lastUpdated: new Date()
    };
  }

  /**
   * Filter tasks for public viewing (remove sensitive information)
   */
  private filterTasksForPublic(
    tasks: Task[],
    settings: PublicShareSettings['settings']
  ): PublicTask[] {
    return tasks
      .filter(task => {
        // Skip cancelled tasks entirely
        if (task.status === 'cancelled') return false;
        
        // Always show completed and in-progress tasks
        if (task.status === 'completed' || task.status === 'in_progress') return true;
        
        // Show delays only if setting allows
        if (task.status === 'delayed' && !settings.showDelays) return false;
        
        // Show pending tasks
        return task.status === 'pending';
      })
      .map(task => ({
        id: task.id,
        title: task.title || 'Untitled Task',
        category: task.category || 'General',
        status: task.status as 'completed' | 'in_progress' | 'delayed' | 'pending',
        priority: task.priority || 'medium',
        startDate: task.startDate,
        endDate: task.endDate,
        progress: this.calculateTaskProgress(task),
        color: task.color || '#3b82f6' // Default to primary blue if no color
        // Omitted: assignedTo, cost, suppliers, notes, etc.
      }));
  }

  /**
   * Calculate task progress percentage
   */
  private calculateTaskProgress(task: Task): number {
    switch (task.status) {
      case 'completed': return 100;
      case 'in_progress': return 60; // Estimate for demo
      case 'delayed': return 30; // Partial progress
      default: return 0;
    }
  }

  /**
   * Generate project phases for timeline visualization
   */
  private generateProjectPhases(tasks: PublicTask[]): Array<{
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
    progress: number;
  }> {
    // Group tasks by category to create phases
    const categories = [...new Set(tasks.map(t => t.category))];
    
    return categories.map(category => {
      const categoryTasks = tasks.filter(t => t.category === category);
      const startDate = new Date(Math.min(...categoryTasks.map(t => t.startDate.getTime())));
      const endDate = new Date(Math.max(...categoryTasks.map(t => t.endDate.getTime())));
      const completedTasks = categoryTasks.filter(t => t.status === 'completed').length;
      const progress = Math.round((completedTasks / categoryTasks.length) * 100);
      
      let status = 'pending';
      if (progress === 100) status = 'completed';
      else if (progress > 0) status = 'in_progress';
      
      return {
        name: category,
        startDate,
        endDate,
        status,
        progress
      };
    }).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  /**
   * Generate public share URL
   */
  public generatePublicUrl(shareToken: string): string {
    return `${this.baseUrl}/public/project/${shareToken}`;
  }

  /**
   * Validate public share token
   */
  public validateShareToken(
    token: string,
    publicShares: PublicShareSettings[]
  ): PublicShareSettings | null {
    const share = publicShares.find(s => s.shareToken === token && s.isActive);
    
    if (!share) return null;
    
    // Check if expired
    if (share.expiresAt && share.expiresAt < new Date()) {
      return null;
    }
    
    return share;
  }

  /**
   * Log public access
   */
  public logPublicAccess(
    shareSettings: PublicShareSettings,
    ipAddress: string,
    userAgent: string,
    viewedSections: string[]
  ): PublicShareSettings {
    const accessEntry = {
      timestamp: new Date(),
      ipAddress,
      userAgent,
      viewedSections
    };

    return {
      ...shareSettings,
      accessLog: [accessEntry, ...shareSettings.accessLog.slice(0, 99)] // Keep last 100 entries
    };
  }

  /**
   * Generate shareable project summary for external stakeholders
   */
  public generateShareableSummary(
    publicView: PublicProjectView
  ): {
    title: string;
    description: string;
    keyMetrics: Array<{ label: string; value: string; color: string }>;
    upcomingMilestones: Array<{ title: string; date: string; priority: string }>;
    phaseProgress: Array<{ phase: string; progress: number; status: string }>;
  } {
    const keyMetrics = [
      {
        label: 'Overall Progress',
        value: `${publicView.stats.completionPercentage}%`,
        color: publicView.stats.completionPercentage > 75 ? 'success' : 
               publicView.stats.completionPercentage > 50 ? 'warning' : 'primary'
      },
      {
        label: 'Tasks Completed',
        value: `${publicView.stats.completedTasks}/${publicView.stats.totalTasks}`,
        color: 'primary'
      },
      {
        label: 'Project Timeline',
        value: format(publicView.project.endDate, 'MMM yyyy'),
        color: 'gray'
      },
      {
        label: 'Current Status',
        value: publicView.project.status.replace('_', ' ').toUpperCase(),
        color: publicView.project.status === 'on_track' ? 'success' : 'warning'
      }
    ];

    const upcomingMilestones = publicView.milestones
      .filter(m => m.status !== 'completed')
      .slice(0, 5)
      .map(milestone => ({
        title: milestone.title,
        date: format(milestone.endDate, 'MMM dd, yyyy'),
        priority: milestone.priority
      }));

    const phaseProgress = publicView.timeline.phases.map(phase => ({
      phase: phase.name,
      progress: phase.progress,
      status: phase.status
    }));

    return {
      title: `${publicView.project.name} - Project Update`,
      description: publicView.project.description,
      keyMetrics,
      upcomingMilestones,
      phaseProgress
    };
  }

  /**
   * Get public share analytics
   */
  public getShareAnalytics(
    shareSettings: PublicShareSettings
  ): {
    totalViews: number;
    uniqueVisitors: number;
    recentViews: number;
    popularSections: Array<{ section: string; views: number }>;
    viewsByDate: Array<{ date: string; views: number }>;
  } {
    const accessLog = shareSettings.accessLog;
    const uniqueIPs = new Set(accessLog.map(entry => entry.ipAddress));
    
    // Views in the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentViews = accessLog.filter(entry => entry.timestamp >= weekAgo).length;

    // Count section views
    const sectionCounts: Record<string, number> = {};
    accessLog.forEach(entry => {
      entry.viewedSections.forEach(section => {
        sectionCounts[section] = (sectionCounts[section] || 0) + 1;
      });
    });

    const popularSections = Object.entries(sectionCounts)
      .map(([section, views]) => ({ section, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    return {
      totalViews: accessLog.length,
      uniqueVisitors: uniqueIPs.size,
      recentViews,
      popularSections,
      viewsByDate: [] // Would calculate daily views for chart
    };
  }
}

// Export singleton instance
export const publicSharingService = new PublicSharingService();
export default publicSharingService;
export type { PublicShareSettings, PublicProjectView, PublicTask }; 