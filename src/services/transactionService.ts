import { supabase } from '../lib/supabase';
import { ServiceResponse } from '../types';

function rowToTransaction(row: any): { id: string; user_id: string; user_name: string; amount: number; product: string; status: 'successful' | 'failed' | 'pending'; created_at: string } {
  return {
    id: row.id,
    user_id: row.user_id,
    user_name: row.user_name || '',
    amount: row.amount,
    product: row.product || '',
    status: row.status,
    created_at: row.created_at,
  };
}

export const transactionService = {
  async fetchByUserId(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return { data: null, error: error.message };
    return { data: (data || []).map(rowToTransaction), error: null };
  },

  async recordPurchase(userId: string, userName: string, productName: string, amount: number): Promise<ServiceResponse<any>> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        user_name: userName,
        amount,
        product: productName,
        status: 'successful',
      })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async fetchAll() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return { data: null, error: error.message };
    return { data: (data || []).map(rowToTransaction), error: null };
  },
};
