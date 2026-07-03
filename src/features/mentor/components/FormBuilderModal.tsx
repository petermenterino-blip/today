import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Trash, GripVertical } from 'lucide-react';
import { FormField, CustomForm } from '../../../types';
import { customFormService } from '../../../services/customFormService';
import { notifySuccess, notifyError } from '../../../utils/toast';

interface FormBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const FIELD_TYPES: FormField['type'][] = ['short_text', 'paragraph', 'multiple_choice', 'checkboxes', 'rating', 'date'];

const FormBuilderModal: React.FC<FormBuilderModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);

  const addField = () => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type: 'short_text',
      label: '',
      required: false,
    };
    setFields(prev => [...prev, newField]);
  };

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    if (fields.length === 0) return;

    setSaving(true);
    try {
      const cleanedFields = fields.map(f => ({
        ...f,
        options: (f.type === 'multiple_choice' || f.type === 'checkboxes') ? (f.options || []) : undefined,
      }));

      await customFormService.createForm({
        title: title.trim(),
        description: description.trim(),
        fields: cleanedFields,
        assigned_to: [],
      });
      notifySuccess('Form created successfully');
      setTitle('');
      setDescription('');
      setFields([]);
      onCreated();
      onClose();
    } catch {
      notifyError('Failed to create form');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[40px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-10 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
          <X size={18} />
        </button>

        <div className="mb-8">
          <h3 className="text-3xl font-black uppercase tracking-tighter">Form Builder</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Create a custom intake or assessment form</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Form Title *</label>
            <input type="text" placeholder="e.g. Weekly Reflection" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Description</label>
            <textarea rows={2} placeholder="What is this form for?" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all resize-none" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Fields ({fields.length})</label>
              <button onClick={addField} className="flex items-center gap-1 text-[10px] font-black text-indigo-600 hover:text-indigo-700 transition-all">
                <Plus size={14} /> Add Field
              </button>
            </div>

            {fields.length === 0 && (
              <div className="p-8 bg-slate-50 rounded-[24px] text-center">
                <p className="text-xs text-slate-400 font-medium">No fields yet. Click "Add Field" to start building your form.</p>
              </div>
            )}

            {fields.map((field, i) => (
              <div key={field.id} className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Field {i + 1}</span>
                  <button onClick={() => removeField(field.id)} className="text-slate-300 hover:text-red-500 transition-all">
                    <Trash size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Type</label>
                    <select
                      className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-black transition-all"
                      value={field.type}
                      onChange={e => updateField(field.id, { type: e.target.value as FormField['type'] })}
                    >
                      {FIELD_TYPES.map(t => (
                        <option key={t} value={t}>{t.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Label *</label>
                    <input type="text" placeholder="Field label" className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-black transition-all" value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} />
                  </div>
                </div>

                {(field.type === 'multiple_choice' || field.type === 'checkboxes') && (
                  <div>
                    <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Options (comma separated)</label>
                    <input type="text" placeholder="Option 1, Option 2, Option 3" className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-black transition-all"
                      value={(field.options || []).join(', ')}
                      onChange={e => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-[10px] font-bold text-slate-500">Required</span>
                </label>
              </div>
            ))}
          </div>

          <div className="pt-4 flex gap-3">
            <button onClick={onClose} className="flex-1 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-slate-600">Cancel</button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || fields.length === 0 || saving}
              className="flex-1 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Create Form'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FormBuilderModal;
