import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCustomForms } from '../../hooks/useCustomForms';
import { ClipboardList, ChevronRight, CheckCircle2, Clock, X, ArrowLeft, Send } from 'lucide-react';
import type { CustomForm, FormField as FormFieldType } from '../../types';
import { notifySuccess } from '../../utils/toast';

interface StudentFormsProps {
  userId: string;
  userName: string;
}

const StudentForms: React.FC<StudentFormsProps> = ({ userId, userName }) => {
  const { forms, submissions, submitForm } = useCustomForms(userId);
  const [selectedForm, setSelectedForm] = useState<CustomForm | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  const hasSubmitted = (formId: string) => submissions.some(s => s.form_id === formId);

  const getSubmission = (formId: string) => submissions.find(s => s.form_id === formId);

  const handleOpenForm = (form: CustomForm) => {
    setSelectedForm(form);
    const existing = getSubmission(form.id);
    setResponses(existing?.responses || {});
  };

  const handleResponse = (fieldId: string, value: any) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedForm) return;
    setSubmitting(true);
    try {
      await submitForm({
        form_id: selectedForm.id,
        user_id: userId,
        user_name: userName,
        responses,
      });
      notifySuccess('Form submitted');
      setSelectedForm(null);
      setResponses({});
    } catch {
      // error handled by service
    } finally {
      setSubmitting(false);
    }
  };

  if (selectedForm) {
    const existing = getSubmission(selectedForm.id);
    const isReadonly = !!existing;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => { setSelectedForm(null); setResponses({}); }}
          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to forms
        </button>

        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 space-y-8">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">{selectedForm.title}</h2>
            {selectedForm.description && (
              <p className="mt-2 text-sm text-slate-500 font-medium">{selectedForm.description}</p>
            )}
            {isReadonly && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                <CheckCircle2 size={12} />
                Submitted
              </div>
            )}
          </div>

          <div className="space-y-6">
            {selectedForm.fields.map(field => (
              <div key={field.id}>
                <FormFieldRenderer
                  field={field}
                  value={responses[field.id]}
                  onChange={(v) => handleResponse(field.id, v)}
                  readonly={isReadonly}
                />
              </div>
            ))}
          </div>

          {!isReadonly && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center justify-center gap-2 w-full py-4 bg-black text-white rounded-[20px] font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit'}
              <Send size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  const formsWithSubmission = forms.map(f => ({
    ...f,
    submitted: hasSubmitted(f.id),
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Custom Forms</h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
          {formsWithSubmission.filter(f => f.submitted).length} of {forms.length} completed
        </p>
      </div>

      {forms.length === 0 && (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-12 text-center">
          <ClipboardList size={40} className="mx-auto text-slate-200 mb-4" />
          <p className="text-sm font-black uppercase tracking-wider text-slate-300">No forms assigned yet</p>
        </div>
      )}

      <div className="grid gap-4">
        {formsWithSubmission.map(form => (
          <motion.button
            key={form.id}
            onClick={() => handleOpenForm(form)}
            className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 text-left hover:border-indigo-200 hover:shadow-md transition-all group"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase tracking-tighter">{form.title}</h3>
                {form.description && (
                  <p className="text-sm text-slate-500 font-medium line-clamp-2">{form.description}</p>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {form.fields.length} field{form.fields.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {form.submitted ? (
                  <span className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 size={12} />
                    Done
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <Clock size={12} />
                    Pending
                  </span>
                )}
                <ChevronRight size={18} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

function FormFieldRenderer({
  field,
  value,
  onChange,
  readonly,
}: {
  field: FormFieldType;
  value: any;
  onChange: (v: any) => void;
  readonly: boolean;
}) {
  const baseInput = "w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-indigo-400 focus:bg-white transition-all";
  const baseLabel = "text-sm font-black uppercase tracking-tight";

  switch (field.type) {
    case 'short_text':
      return (
        <div className="space-y-2">
          <label className={baseLabel}>{field.label}{field.required && <span className="text-rose-400 ml-1">*</span>}</label>
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className={baseInput}
            disabled={readonly}
            placeholder="Your answer..."
          />
        </div>
      );
    case 'paragraph':
      return (
        <div className="space-y-2">
          <label className={baseLabel}>{field.label}{field.required && <span className="text-rose-400 ml-1">*</span>}</label>
          <textarea
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className={`${baseInput} min-h-[120px] resize-none`}
            disabled={readonly}
            placeholder="Your answer..."
          />
        </div>
      );
    case 'multiple_choice':
      return (
        <div className="space-y-2">
          <label className={baseLabel}>{field.label}{field.required && <span className="text-rose-400 ml-1">*</span>}</label>
          <div className="space-y-2">
            {(field.options || []).map(opt => (
              <button
                key={opt}
                onClick={() => !readonly && onChange(opt)}
                className={`w-full text-left px-5 py-4 rounded-2xl border text-sm font-medium transition-all ${
                  value === opt
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    case 'checkboxes':
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          <label className={baseLabel}>{field.label}{field.required && <span className="text-rose-400 ml-1">*</span>}</label>
          <div className="space-y-2">
            {(field.options || []).map(opt => {
              const isChecked = selected.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => {
                    if (readonly) return;
                    onChange(isChecked ? selected.filter((s: string) => s !== opt) : [...selected, opt]);
                  }}
                  className={`w-full text-left px-5 py-4 rounded-2xl border text-sm font-medium transition-all ${
                    isChecked
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      isChecked ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'
                    }`}>
                      {isChecked && <CheckCircle2 size={12} className="text-white" />}
                    </span>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    case 'rating':
      return (
        <div className="space-y-2">
          <label className={baseLabel}>{field.label}{field.required && <span className="text-rose-400 ml-1">*</span>}</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => !readonly && onChange(n)}
                className={`w-12 h-12 rounded-2xl border-2 text-sm font-black transition-all ${
                  (value || 0) >= n
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                    : 'bg-slate-50 border-slate-200 text-slate-300 hover:border-slate-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      );
    case 'date':
      return (
        <div className="space-y-2">
          <label className={baseLabel}>{field.label}{field.required && <span className="text-rose-400 ml-1">*</span>}</label>
          <input
            type="date"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className={baseInput}
            disabled={readonly}
          />
        </div>
      );
    default:
      return null;
  }
}

export default StudentForms;
