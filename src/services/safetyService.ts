import { supabase } from '../lib/supabase';
import type { SafetyReport, SafetyTraining, SafetyInspection, SafetyCompliance } from '../types';

export const safetyService = {
  // Safety Reports
  async getSafetyReports(projectId: string): Promise<SafetyReport[]> {
    try {
      const { data, error } = await supabase
        .from('safety_reports')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching safety reports:', error);
      return [];
    }
  },

  async createSafetyReport(report: Omit<SafetyReport, 'id' | 'created_at' | 'updated_at'>): Promise<SafetyReport | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('safety_reports')
        .insert({
          ...report,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating safety report:', error);
      return null;
    }
  },

  async generateMonthlyReport(projectId: string, month: number, year: number): Promise<SafetyReport | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get all safety data for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const { data: inspections } = await supabase
        .from('safety_inspections')
        .select('*')
        .eq('project_id', projectId)
        .gte('inspection_date', startDate.toISOString())
        .lte('inspection_date', endDate.toISOString());

      const { data: training } = await supabase
        .from('safety_training')
        .select('*')
        .eq('project_id', projectId)
        .gte('training_date', startDate.toISOString())
        .lte('training_date', endDate.toISOString());

      const { data: compliance } = await supabase
        .from('safety_compliance')
        .select('*')
        .eq('project_id', projectId)
        .gte('check_date', startDate.toISOString())
        .lte('check_date', endDate.toISOString());

      // Generate report summary
      const totalInspections = inspections?.length || 0;
      const passedInspections = inspections?.filter(i => i.status === 'passed').length || 0;
      const totalTraining = training?.length || 0;
      const complianceScore = compliance?.length ? 
        (compliance.filter(c => c.compliant).length / compliance.length * 100) : 0;

      const reportData = {
        project_id: projectId,
        report_type: 'monthly',
        title: `Safety Report - ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        summary: `Monthly safety report covering ${totalInspections} inspections, ${totalTraining} training sessions, and ${complianceScore.toFixed(1)}% compliance rate.`,
        details: {
          inspections: {
            total: totalInspections,
            passed: passedInspections,
            failed: totalInspections - passedInspections
          },
          training: {
            total: totalTraining,
            completed: training?.filter(t => t.status === 'completed').length || 0
          },
          compliance: {
            score: complianceScore,
            total_checks: compliance?.length || 0
          }
        },
        status: 'completed'
      };

      return await this.createSafetyReport(reportData);
    } catch (error) {
      console.error('Error generating monthly report:', error);
      return null;
    }
  },

  // Safety Training
  async getSafetyTraining(projectId: string): Promise<SafetyTraining[]> {
    try {
      const { data, error } = await supabase
        .from('safety_training')
        .select('*')
        .eq('project_id', projectId)
        .order('training_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching safety training:', error);
      return [];
    }
  },

  async createSafetyTraining(training: Omit<SafetyTraining, 'id' | 'created_at' | 'updated_at'>): Promise<SafetyTraining | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('safety_training')
        .insert({
          ...training,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating safety training:', error);
      return null;
    }
  },

  async updateTrainingStatus(trainingId: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('safety_training')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', trainingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating training status:', error);
      return false;
    }
  },

  // Safety Inspections
  async getSafetyInspections(projectId: string): Promise<SafetyInspection[]> {
    try {
      const { data, error } = await supabase
        .from('safety_inspections')
        .select('*')
        .eq('project_id', projectId)
        .order('inspection_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching safety inspections:', error);
      return [];
    }
  },

  async createSafetyInspection(inspection: Omit<SafetyInspection, 'id' | 'created_at' | 'updated_at'>): Promise<SafetyInspection | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('safety_inspections')
        .insert({
          ...inspection,
          inspector_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating safety inspection:', error);
      return null;
    }
  },

  async updateInspectionStatus(inspectionId: string, status: 'scheduled' | 'in_progress' | 'passed' | 'failed'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('safety_inspections')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', inspectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating inspection status:', error);
      return false;
    }
  },

  // Safety Compliance
  async getSafetyCompliance(projectId: string): Promise<SafetyCompliance[]> {
    try {
      const { data, error } = await supabase
        .from('safety_compliance')
        .select('*')
        .eq('project_id', projectId)
        .order('check_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching safety compliance:', error);
      return [];
    }
  },

  async createSafetyCompliance(compliance: Omit<SafetyCompliance, 'id' | 'created_at' | 'updated_at'>): Promise<SafetyCompliance | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('safety_compliance')
        .insert({
          ...compliance,
          checked_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating safety compliance:', error);
      return null;
    }
  },

  async updateComplianceStatus(complianceId: string, compliant: boolean, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('safety_compliance')
        .update({ 
          compliant,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', complianceId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating compliance status:', error);
      return false;
    }
  },

  // Statistics
  async getSafetyStats(projectId: string): Promise<{
    totalInspections: number;
    passedInspections: number;
    pendingInspections: number;
    criticalIssues: number;
    totalTraining: number;
    completedTraining: number;
    complianceScore: number;
  }> {
    try {
      const [inspections, training, compliance] = await Promise.all([
        this.getSafetyInspections(projectId),
        this.getSafetyTraining(projectId),
        this.getSafetyCompliance(projectId)
      ]);

      const totalInspections = inspections.length;
      const passedInspections = inspections.filter(i => i.status === 'passed').length;
      const pendingInspections = inspections.filter(i => i.status === 'scheduled' || i.status === 'in_progress').length;
      const criticalIssues = inspections.filter(i => i.status === 'failed' && i.severity === 'critical').length;
      
      const totalTraining = training.length;
      const completedTraining = training.filter(t => t.status === 'completed').length;
      
      const complianceScore = compliance.length ? 
        (compliance.filter(c => c.compliant).length / compliance.length * 100) : 0;

      return {
        totalInspections,
        passedInspections,
        pendingInspections,
        criticalIssues,
        totalTraining,
        completedTraining,
        complianceScore
      };
    } catch (error) {
      console.error('Error fetching safety stats:', error);
      return {
        totalInspections: 0,
        passedInspections: 0,
        pendingInspections: 0,
        criticalIssues: 0,
        totalTraining: 0,
        completedTraining: 0,
        complianceScore: 0
      };
    }
  }
};

export default safetyService; 