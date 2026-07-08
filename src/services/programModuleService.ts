import { supabase } from '../lib/supabase';
import { ProgramModule, ServiceResponse } from '../types';
import { handleError } from '../lib/serviceHelper';

const MODULE_FIELDS = 'id,program_id,title,description,module_order,learning_outcomes,resources,attachments,videos,external_links,created_at,updated_at';

function rowToModule(row: any): ProgramModule {
  return {
    id: row.id,
    program_id: row.program_id,
    title: row.title,
    description: row.description || '',
    module_order: row.module_order || 0,
    learning_outcomes: row.learning_outcomes || [],
    resources: row.resources || [],
    attachments: row.attachments || [],
    videos: row.videos || [],
    external_links: row.external_links || [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const programModuleService = {
  async fetchByProgram(programId: string): Promise<ServiceResponse<ProgramModule[]>> {
    const { data, error } = await supabase
      .from('program_modules')
      .select(MODULE_FIELDS)
      .eq('program_id', programId)
      .order('module_order', { ascending: true });
    if (error) return { data: null, error: handleError(error).error };
    return { data: (data || []).map(rowToModule), error: null };
  },

  async getById(id: string): Promise<ServiceResponse<ProgramModule>> {
    const { data, error } = await supabase
      .from('program_modules')
      .select(MODULE_FIELDS)
      .eq('id', id)
      .maybeSingle();
    if (error) return { data: null, error: handleError(error).error };
    if (!data) return { data: null, error: 'Module not found' };
    return { data: rowToModule(data), error: null };
  },

  async insert(module: Omit<ProgramModule, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<ProgramModule>> {
    const { data, error } = await supabase
      .from('program_modules')
      .insert({
        program_id: module.program_id,
        title: module.title,
        description: module.description || '',
        module_order: module.module_order,
        learning_outcomes: module.learning_outcomes || [],
        resources: module.resources || [],
        attachments: module.attachments || [],
        videos: module.videos || [],
        external_links: module.external_links || [],
      })
      .select(MODULE_FIELDS)
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data: rowToModule(data), error: null };
  },

  async update(id: string, updates: Partial<ProgramModule>): Promise<ServiceResponse<ProgramModule>> {
    const row: Record<string, any> = {};
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.description !== undefined) row.description = updates.description;
    if (updates.module_order !== undefined) row.module_order = updates.module_order;
    if (updates.learning_outcomes !== undefined) row.learning_outcomes = updates.learning_outcomes;
    if (updates.resources !== undefined) row.resources = updates.resources;
    if (updates.attachments !== undefined) row.attachments = updates.attachments;
    if (updates.videos !== undefined) row.videos = updates.videos;
    if (updates.external_links !== undefined) row.external_links = updates.external_links;

    const { data, error } = await supabase
      .from('program_modules')
      .update(row)
      .eq('id', id)
      .select(MODULE_FIELDS)
      .single();
    if (error) return { data: null, error: handleError(error).error };
    return { data: rowToModule(data), error: null };
  },

  async delete(id: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase
      .from('program_modules')
      .delete()
      .eq('id', id);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async reorder(programId: string, moduleIds: string[]): Promise<ServiceResponse<void>> {
    const updates = moduleIds.map((id, index) => ({
      id,
      program_id: programId,
      module_order: index,
    }));
    const { error } = await supabase
      .from('program_modules')
      .upsert(updates, { onConflict: 'id' });
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async getMaxOrder(programId: string): Promise<number> {
    const { data } = await supabase
      .from('program_modules')
      .select('module_order')
      .eq('program_id', programId)
      .order('module_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.module_order ?? -1;
  },
};
