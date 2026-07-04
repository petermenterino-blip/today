import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Plus, Pencil, Trash2, Loader2, CheckCircle2, AlertCircle,
  Save, Archive, Eye, EyeOff, Search
} from 'lucide-react';
import { useResources } from '../../hooks/useResources';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { notifySuccess } from '../../utils/toast';
import type { ResourceCategory } from '../../types/resources';

interface CategoryManagementModalProps {
  open: boolean;
  onClose: () => void;
}

const emptyCategory = { name: '', slug: '', description: '', color: '#6366f1', icon: '' };

const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({ open, onClose }) => {
  const { useCategories, createCategory, updateCategory, deleteCategory, service } = useResources();
  const { data: categories = [], isLoading } = useCategories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState<Partial<ResourceCategory>>(emptyCategory);
  const [deleteTarget, setDeleteTarget] = useState<ResourceCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = categories.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleNew = () => {
    setForm(emptyCategory);
    setEditingId(null);
    setShowNewForm(true);
  };

  const handleEdit = (cat: ResourceCategory) => {
    setForm({ name: cat.name, slug: cat.slug, description: cat.description, color: cat.color, icon: cat.icon });
    setEditingId(cat.id);
    setShowNewForm(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateCategory({ id: editingId, updates: form });
      } else {
        await createCategory(form);
      }
      setShowNewForm(false);
      setForm(emptyCategory);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Manage Categories</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{categories.length} categories</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleNew}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> New
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="px-6 pt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-slate-400">No categories found</p>
                  </div>
                ) : (
                  filtered.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: cat.color || '#6366f1' }}
                        >
                          {cat.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {cat.slug} · {(cat as any).resource_count || 0} resources
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(cat as any).is_archived ? (
                          <button
                            onClick={() => updateCategory({ id: cat.id, updates: { is_archived: false } })}
                            className="p-2 hover:bg-white rounded-xl transition-colors"
                            title="Unarchive"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEdit(cat)}
                            className="p-2 hover:bg-white rounded-xl transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className="p-2 hover:bg-white rounded-xl transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* New/Edit Form Slide-in */}
              {showNewForm && (
                <div className="border-t border-slate-100 p-6 space-y-4 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">
                      {editingId ? 'Edit Category' : 'New Category'}
                    </h3>
                    <button
                      onClick={() => { setShowNewForm(false); setForm(emptyCategory); setEditingId(null); }}
                      className="p-1 hover:bg-white rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Name</label>
                      <input
                        type="text"
                        value={form.name || ''}
                        onChange={(e) => {
                          setForm(f => ({ ...f, name: e.target.value }));
                          if (!editingId) setForm(f => ({ ...f, slug: generateSlug(e.target.value), name: e.target.value }));
                        }}
                        placeholder="e.g. Worksheets"
                        className="w-full px-3 py-2 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Slug</label>
                      <input
                        type="text"
                        value={form.slug || ''}
                        onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                        placeholder="worksheets"
                        className="w-full px-3 py-2 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Description</label>
                      <input
                        type="text"
                        value={form.description || ''}
                        onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Optional description"
                        className="w-full px-3 py-2 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Color</label>
                      <input
                        type="color"
                        value={form.color || '#6366f1'}
                        onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))}
                        className="w-full h-10 rounded-xl border border-slate-100 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Icon (emoji)</label>
                      <input
                        type="text"
                        value={form.icon || ''}
                        onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))}
                        placeholder="📝"
                        className="w-full px-3 py-2 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => { setShowNewForm(false); setForm(emptyCategory); setEditingId(null); }}
                      className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!form.name?.trim() || saving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      {editingId ? 'Update' : 'Create'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteCategory(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Resources in this category will not be deleted.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
};

export default CategoryManagementModal;
