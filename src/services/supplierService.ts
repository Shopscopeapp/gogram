import { supabase } from '../lib/supabase';
import type { Supplier, Delivery } from '../types';

export interface CreateSupplierData {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
  specialties: string[];
  rating?: number;
  notes?: string;
}

export interface UpdateSupplierData extends Partial<CreateSupplierData> {
  is_active?: boolean;
}

export interface CreateDeliveryData {
  task_id: string;
  supplier_id: string;
  planned_date: Date;
  notes?: string;
}

class SupplierService {
  /**
   * Create a new supplier
   */
  async createSupplier(supplierData: CreateSupplierData): Promise<{ success: boolean; supplier?: Supplier; error?: string }> {
    try {
      const { data: supplier, error } = await supabase
        .from('suppliers')
        .insert({
          name: supplierData.name,
          company: supplierData.company,
          email: supplierData.email,
          phone: supplierData.phone,
          address: supplierData.address,
          specialties: supplierData.specialties,
          rating: supplierData.rating,
          notes: supplierData.notes,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Supplier creation error:', error);
        return { success: false, error: 'Failed to create supplier' };
      }

      const formattedSupplier: Supplier = {
        id: supplier.id,
        name: supplier.name,
        company: supplier.company,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        specialties: supplier.specialties || [],
        rating: supplier.rating,
        notes: supplier.notes,
        is_active: supplier.is_active,
        created_at: new Date(supplier.created_at),
        updated_at: new Date(supplier.updated_at),
      };

      return { success: true, supplier: formattedSupplier };
    } catch (error) {
      console.error('Create supplier error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get all active suppliers
   */
  async getSuppliers(): Promise<{ success: boolean; suppliers?: Supplier[]; error?: string }> {
    try {
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Get suppliers error:', error);
        return { success: false, error: 'Failed to fetch suppliers' };
      }

      const formattedSuppliers: Supplier[] = suppliers.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        company: supplier.company,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        specialties: supplier.specialties || [],
        rating: supplier.rating,
        notes: supplier.notes,
        is_active: supplier.is_active,
        created_at: new Date(supplier.created_at),
        updated_at: new Date(supplier.updated_at),
      }));

      return { success: true, suppliers: formattedSuppliers };
    } catch (error) {
      console.error('Get suppliers error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Update supplier
   */
  async updateSupplier(supplierId: string, updates: UpdateSupplierData): Promise<{ success: boolean; supplier?: Supplier; error?: string }> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Map all possible updates
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.company !== undefined) updateData.company = updates.company;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.specialties !== undefined) updateData.specialties = updates.specialties;
      if (updates.rating !== undefined) updateData.rating = updates.rating;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

      const { data: supplier, error } = await supabase
        .from('suppliers')
        .update(updateData)
        .eq('id', supplierId)
        .select()
        .single();

      if (error) {
        console.error('Update supplier error:', error);
        return { success: false, error: 'Failed to update supplier' };
      }

      const formattedSupplier: Supplier = {
        id: supplier.id,
        name: supplier.name,
        company: supplier.company,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        specialties: supplier.specialties || [],
        rating: supplier.rating,
        notes: supplier.notes,
        is_active: supplier.is_active,
        created_at: new Date(supplier.created_at),
        updated_at: new Date(supplier.updated_at),
      };

      return { success: true, supplier: formattedSupplier };
    } catch (error) {
      console.error('Update supplier error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Delete/deactivate supplier
   */
  async deleteSupplier(supplierId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Instead of hard delete, we deactivate the supplier
      const { error } = await supabase
        .from('suppliers')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', supplierId);

      if (error) {
        console.error('Delete supplier error:', error);
        return { success: false, error: 'Failed to delete supplier' };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete supplier error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Create a delivery
   */
  async createDelivery(deliveryData: CreateDeliveryData): Promise<{ success: boolean; delivery?: Delivery; error?: string }> {
    try {
      const { data: delivery, error } = await supabase
        .from('deliveries')
        .insert({
          task_id: deliveryData.task_id,
          supplier_id: deliveryData.supplier_id,
          planned_date: deliveryData.planned_date.toISOString(),
          confirmation_status: 'pending',
          notes: deliveryData.notes,
        })
        .select()
        .single();

      if (error) {
        console.error('Delivery creation error:', error);
        return { success: false, error: 'Failed to create delivery' };
      }

      const formattedDelivery: Delivery = {
        id: delivery.id,
        task_id: delivery.task_id,
        supplier_id: delivery.supplier_id,
        planned_date: new Date(delivery.planned_date),
        confirmation_status: delivery.confirmation_status,
        notes: delivery.notes,
        created_at: new Date(delivery.created_at),
        updated_at: new Date(delivery.updated_at),
      };

      return { success: true, delivery: formattedDelivery };
    } catch (error) {
      console.error('Create delivery error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get project deliveries
   */
  async getProjectDeliveries(projectId: string): Promise<{ success: boolean; deliveries?: Delivery[]; error?: string }> {
    try {
      const { data: deliveries, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          tasks!inner (
            project_id
          )
        `)
        .eq('tasks.project_id', projectId)
        .order('planned_date', { ascending: true });

      if (error) {
        console.error('Get project deliveries error:', error);
        return { success: false, error: 'Failed to fetch deliveries' };
      }

      const formattedDeliveries: Delivery[] = deliveries.map(delivery => ({
        id: delivery.id,
        task_id: delivery.task_id,
        supplier_id: delivery.supplier_id,
        planned_date: new Date(delivery.planned_date),
        confirmation_status: delivery.confirmation_status,
        notes: delivery.notes,
        created_at: new Date(delivery.created_at),
        updated_at: new Date(delivery.updated_at),
      }));

      return { success: true, deliveries: formattedDeliveries };
    } catch (error) {
      console.error('Get project deliveries error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Update delivery
   */
  async updateDelivery(deliveryId: string, updates: {
    planned_date?: Date;
    confirmation_status?: 'pending' | 'confirmed' | 'rejected';
    notes?: string;
  }): Promise<{ success: boolean; delivery?: Delivery; error?: string }> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.planned_date !== undefined) updateData.planned_date = updates.planned_date.toISOString();
      if (updates.confirmation_status !== undefined) updateData.confirmation_status = updates.confirmation_status;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { data: delivery, error } = await supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', deliveryId)
        .select()
        .single();

      if (error) {
        console.error('Update delivery error:', error);
        return { success: false, error: 'Failed to update delivery' };
      }

      const formattedDelivery: Delivery = {
        id: delivery.id,
        task_id: delivery.task_id,
        supplier_id: delivery.supplier_id,
        planned_date: new Date(delivery.planned_date),
        confirmation_status: delivery.confirmation_status,
        notes: delivery.notes,
        created_at: new Date(delivery.created_at),
        updated_at: new Date(delivery.updated_at),
      };

      return { success: true, delivery: formattedDelivery };
    } catch (error) {
      console.error('Update delivery error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get delivery by ID (for supplier confirmation page)
   */
  async getDeliveryById(deliveryId: string): Promise<{ success: boolean; delivery?: Delivery; error?: string }> {
    try {
      const { data: delivery, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', deliveryId)
        .single();

      if (error) {
        console.error('Get delivery error:', error);
        return { success: false, error: 'Delivery not found' };
      }

      const formattedDelivery: Delivery = {
        id: delivery.id,
        task_id: delivery.task_id,
        supplier_id: delivery.supplier_id,
        planned_date: new Date(delivery.planned_date),
        confirmation_status: delivery.confirmation_status,
        notes: delivery.notes,
        created_at: new Date(delivery.created_at),
        updated_at: new Date(delivery.updated_at),
      };

      return { success: true, delivery: formattedDelivery };
    } catch (error) {
      console.error('Get delivery error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Confirm delivery (for supplier confirmation)
   */
  async confirmDelivery(deliveryId: string, confirmed: boolean, notes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({
          confirmation_status: confirmed ? 'confirmed' : 'rejected',
          notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deliveryId);

      if (error) {
        console.error('Confirm delivery error:', error);
        return { success: false, error: 'Failed to update delivery status' };
      }

      // Log the confirmation
      await supabase
        .from('delivery_confirmations')
        .insert({
          delivery_id: deliveryId,
          confirmed: confirmed,
          confirmed_at: new Date().toISOString(),
          notes: notes,
        });

      return { success: true };
    } catch (error) {
      console.error('Confirm delivery error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Search suppliers by name, company, or specialties
   */
  async searchSuppliers(query: string): Promise<{ success: boolean; suppliers?: Supplier[]; error?: string }> {
    try {
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,company.ilike.%${query}%,specialties.cs.{${query}}`)
        .order('name', { ascending: true });

      if (error) {
        console.error('Search suppliers error:', error);
        return { success: false, error: 'Failed to search suppliers' };
      }

      const formattedSuppliers: Supplier[] = suppliers.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        company: supplier.company,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        specialties: supplier.specialties || [],
        rating: supplier.rating,
        notes: supplier.notes,
        is_active: supplier.is_active,
        created_at: new Date(supplier.created_at),
        updated_at: new Date(supplier.updated_at),
      }));

      return { success: true, suppliers: formattedSuppliers };
    } catch (error) {
      console.error('Search suppliers error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get suppliers by specialty
   */
  async getSuppliersBySpecialty(specialty: string): Promise<{ success: boolean; suppliers?: Supplier[]; error?: string }> {
    try {
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .contains('specialties', [specialty])
        .order('rating', { ascending: false });

      if (error) {
        console.error('Get suppliers by specialty error:', error);
        return { success: false, error: 'Failed to fetch suppliers' };
      }

      const formattedSuppliers: Supplier[] = suppliers.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        company: supplier.company,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        specialties: supplier.specialties || [],
        rating: supplier.rating,
        notes: supplier.notes,
        is_active: supplier.is_active,
        created_at: new Date(supplier.created_at),
        updated_at: new Date(supplier.updated_at),
      }));

      return { success: true, suppliers: formattedSuppliers };
    } catch (error) {
      console.error('Get suppliers by specialty error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}

export const supplierService = new SupplierService();
export default supplierService; 