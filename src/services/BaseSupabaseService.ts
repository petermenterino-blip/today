import { supabase } from '../lib/supabase';
import type { ServiceResponse } from '../types';

type WithId = { id: string };

export class BaseSupabaseService<T extends WithId> {
  constructor(protected tableName: string) {}

  async getAll(options?: {
    filters?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  }): Promise<ServiceResponse<T[]>> {
    try {
      let query = supabase.from(this.tableName).select('*');

      if (options?.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        }
      }

      if (options?.order) {
        query = query.order(options.order.column, {
          ascending: options.order.ascending ?? true,
        });
      }

      if (options?.limit) query = query.limit(options.limit);
      if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 100) - 1);

      const { data, error } = await query;
      if (error) return { data: null, error: error.message };
      return { data: data as T[], error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  }

  async getById(id: string): Promise<ServiceResponse<T | null>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as T, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  }

  async create(data: Partial<T>): Promise<ServiceResponse<T | null>> {
    try {
      const { data: created, error } = await supabase
        .from(this.tableName)
        .insert(data as any)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: created as T, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  }

  async update(id: string, updates: Partial<T>): Promise<ServiceResponse<T | null>> {
    try {
      const { data: updated, error } = await supabase
        .from(this.tableName)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: updated as T, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  }

  async softDelete(id: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq('id', id);

      if (error) return { data: undefined, error: error.message };
      return { data: undefined, error: null };
    } catch (err: any) {
      return { data: undefined, error: err.message };
    }
  }

  async hardDelete(id: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) return { data: undefined, error: error.message };
      return { data: undefined, error: null };
    } catch (err: any) {
      return { data: undefined, error: err.message };
    }
  }
}
