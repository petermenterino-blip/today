import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Filter, SortAsc, SortDesc, Clock, Star, CheckCircle2,
  X, ChevronDown, ChevronUp, MoreHorizontal, Archive, Trash2,
  MessageSquare, AlertTriangle, Calendar, Tag, Download, Printer,
  FileText, User, BookOpen, BarChart3, ArrowUpDown, Loader2,
  Check, Send, Plus, Eye, EyeOff, RefreshCw, AlertCircle,
  Clock3, Flag, FlagTriangleLeft, Flame, Target,
  ThumbsUp, ThumbsDown, FileDown, FileSpreadsheet
} from 'lucide-react';
import { Review, ReviewStatus, ReviewPriority } from '../../../interfaces';
import { useReviews, useReviewFilters } from '../../../hooks/useReviews';
import { useAuth } from '../../../context/AuthContext';
import { notifySuccess, notifyError } from '../../../utils/toast';
import { reviewService } from '../../../services/reviewService';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

const STATUS_COLORS: Record<ReviewStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Draft' },
  assigned: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Assigned' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
  submitted: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Submitted' },
  in_review: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'In Review' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
  archived: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Archived' },
};

const PRIORITY_ICONS: Record<ReviewPriority, React.ReactNode> = {
  low: <ArrowUpDown size={12} className="text-slate-400" />,
  medium: <Flag size={12} className="text-amber-500" />,
  high: <FlagTriangleLeft size={12} className="text-orange-500" />,
  urgent: <Flame size={12} className="text-red-500" />,
};

function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-amber-200 text-amber-900 rounded px-0.5">{part}</mark>
      : part
  );
}

function ReviewCard({
  review,
  selected,
  onToggleSelect,
  onOpen,
  searchQuery,
}: {
  review: Review;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  searchQuery?: string;
}) {
  const isOverdue = review.due_date && new Date(review.due_date) < new Date() && !['completed', 'archived'].includes(review.status);
  const dueSoon = review.due_date && !isOverdue && new Date(review.due_date).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;
  const sc = STATUS_COLORS[review.status];
  const needsAttention = review.status === 'submitted' || review.status === 'in_review';

  const dueDateCountdown = review.due_date ? Math.ceil((new Date(review.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden bg-white rounded-[24px] border ${
        selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-100'
      } shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer`}
      onClick={onOpen}
    >
      <div className={`absolute left-0 top-0 w-1.5 h-full ${isOverdue ? 'bg-red-500' : dueSoon ? 'bg-amber-500' : needsAttention ? 'bg-indigo-400' : 'bg-transparent'}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-charcoal flex items-center justify-center text-white text-[10px] font-black shrink-0">
              {(review.student_name || 'S').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{highlightText(review.student_name || 'Student', searchQuery || '')}</p>
              <p className="text-[9px] text-slate-400 font-medium truncate">{review.student_email || ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full ${sc.bg} ${sc.text}`}>
              {sc.label}
            </span>
            <input
              type="checkbox"
              checked={selected}
              onChange={e => { e.stopPropagation(); onToggleSelect(); }}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>

        <h4 className="text-sm font-black text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
          {highlightText(review.title, searchQuery || '')}
        </h4>

        {review.description && (
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed line-clamp-2 mb-3">
            {review.description}
          </p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            {PRIORITY_ICONS[review.priority]}
            <span>{review.priority}</span>
          </div>

          {review.due_date && (
            <div className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${
              isOverdue ? 'text-red-500' : dueSoon ? 'text-amber-500' : 'text-slate-400'
            }`}>
              <Clock size={10} />
              <span>{new Date(review.due_date).toLocaleDateString()}</span>
              {dueDateCountdown !== null && !isOverdue && dueDateCountdown <= 7 && (
                <span className="text-[8px]">({dueDateCountdown}d)</span>
              )}
            </div>
          )}

          {review.rating && (
            <div className="flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase tracking-wider">
              <Star size={10} className="fill-amber-500" />
              <span>{review.rating}/5</span>
            </div>
          )}

          {review.program_name && (
            <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-400">
              <BookOpen size={10} />
              <span className="truncate max-w-[100px]">{review.program_name}</span>
            </div>
          )}

          {review.estimated_review_time && (
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
              <Clock3 size={10} />
              <span>{review.estimated_review_time}min</span>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${review.completion_percentage}%` }}
            />
          </div>
          <span className="text-[8px] font-bold text-slate-400">{review.completion_percentage}%</span>
        </div>

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {isOverdue && (
            <span className="flex items-center gap-1 text-[8px] font-black text-red-500 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-full">
              <AlertCircle size={8} /> Late
            </span>
          )}
          {dueSoon && !isOverdue && (
            <span className="flex items-center gap-1 text-[8px] font-black text-amber-500 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-full">
              <Clock size={8} /> Due Soon
            </span>
          )}
          {needsAttention && (
            <span className="flex items-center gap-1 text-[8px] font-black text-indigo-500 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full">
              Needs Attention
            </span>
          )}
        </div>

        {review.tags && review.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {review.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[7px] font-bold uppercase rounded">
                {tag}
              </span>
            ))}
            {review.tags.length > 3 && (
              <span className="text-[7px] text-slate-400 font-bold">+{review.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ReviewDetailModal({
  review,
  onClose,
  onUpdate,
}: {
  review: Review;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [feedback, setFeedback] = useState(review.feedback || '');
  const [rating, setRating] = useState(review.rating || 0);
  const [notes, setNotes] = useState(review.mentor_notes || '');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    reviewService.getHistory(review.id).then(h => { setHistory(h); setLoading(false); });
  }, [review.id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleComplete = async () => {
    setSubmitting(true);
    const { error } = await reviewService.updateStatus(review.id, 'completed', { feedback, rating, mentor_notes: notes });
    setSubmitting(false);
    if (error) { notifyError(error); return; }
    notifySuccess('Review completed!');
    onUpdate();
    onClose();
  };

  const handleReturn = async () => {
    setSubmitting(true);
    const { error } = await reviewService.updateStatus(review.id, 'submitted', { feedback, mentor_notes: notes });
    setSubmitting(false);
    if (error) { notifyError(error); return; }
    notifySuccess('Review returned for revision');
    onUpdate();
    onClose();
  };

  const handleArchive = async () => {
    const { error } = await reviewService.archive(review.id);
    if (error) { notifyError(error); return; }
    notifySuccess('Review archived');
    onUpdate();
    onClose();
  };

  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(review.title, 20, 20);
      doc.setFontSize(10);
      doc.text(`Student: ${review.student_name || 'Unknown'}`, 20, 30);
      doc.text(`Status: ${review.status}`, 20, 37);
      doc.text(`Priority: ${review.priority}`, 20, 44);
      if (review.program_name) doc.text(`Program: ${review.program_name}`, 20, 51);
      if (review.rating) doc.text(`Rating: ${review.rating}/5`, 20, 58);
      if (feedback) {
        doc.text('Feedback:', 20, 68);
        const lines = doc.splitTextToSize(feedback, 170);
        doc.text(lines, 20, 75);
      }
      doc.save(`${review.title.replace(/\s+/g, '_')}_review.pdf`);
      notifySuccess('PDF exported');
    } catch {
      notifyError('Failed to export PDF');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[40px] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-white z-10 p-8 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black uppercase tracking-tighter">{review.title}</h2>
              <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full ${STATUS_COLORS[review.status].bg} ${STATUS_COLORS[review.status].text}`}>
                {STATUS_COLORS[review.status].label}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {review.student_name || 'Student'} • {review.program_name || 'No Program'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportPDF} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-colors" title="Export PDF">
              <FileDown size={16} className="text-slate-500" />
            </button>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Student</p>
              <p className="text-sm font-bold mt-1">{review.student_name || 'Unknown'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Priority</p>
              <div className="flex items-center gap-1.5 mt-1">
                {PRIORITY_ICONS[review.priority]}
                <p className="text-sm font-bold capitalize">{review.priority}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Created</p>
              <p className="text-sm font-bold mt-1">{new Date(review.created_at).toLocaleDateString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Completion</p>
              <p className="text-sm font-bold mt-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-400 to-emerald-400 rounded-full" style={{ width: `${review.completion_percentage}%` }} />
                  </div>
                  <span>{review.completion_percentage}%</span>
                </div>
              </p>
            </div>
          </div>

          {review.description && (
            <div className="p-6 bg-slate-50 rounded-3xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Description</p>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">{review.description}</p>
            </div>
          )}

          {review.tags && review.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {review.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-wider rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {review.student_response && (
            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-2">Student Response</p>
              <p className="text-sm font-medium text-blue-800 leading-relaxed">{review.student_response}</p>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Feedback & Review</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    n <= rating ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Star size={18} className={n <= rating ? 'fill-amber-500' : ''} />
                </button>
              ))}
            </div>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Write your feedback for the student..."
              className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl min-h-[120px] text-sm font-medium outline-none focus:border-black transition-all resize-none"
            />
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Private mentor notes (not visible to student)..."
              className="w-full p-5 bg-amber-50/50 border border-amber-100 rounded-3xl min-h-[80px] text-sm font-medium outline-none focus:border-amber-400 transition-all resize-none"
            />
          </div>

          <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              Timeline ({history.length} events)
            </p>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {history.map((h: any) => (
                <div key={h.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700">
                      {h.from_status || 'Created'} → {h.to_status}
                    </p>
                    {h.comment && <p className="text-[10px] text-slate-400">{h.comment}</p>}
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium shrink-0">
                    {new Date(h.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {!loading && history.length === 0 && (
                <p className="text-[10px] text-slate-400 text-center py-4">No history yet</p>
              )}
              {loading && (
                <div className="flex justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-slate-300" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 flex flex-wrap gap-3 justify-between">
          <div className="flex gap-2">
            <button onClick={handleArchive} className="px-5 py-3 border border-slate-200 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-slate-500">
              <Archive size={14} className="inline mr-1" /> Archive
            </button>
          </div>
          <div className="flex gap-2">
            {review.status === 'in_review' && (
              <button
                onClick={handleReturn}
                disabled={submitting}
                className="px-6 py-3 bg-amber-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin inline" /> : <Send size={14} className="inline mr-1" />} Return for Revision
              </button>
            )}
            <button
              onClick={handleComplete}
              disabled={submitting}
              className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="animate-spin inline" /> : <Check size={14} className="inline mr-1" />} Complete Review
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CreateReviewModal({
  onClose,
  mentorId,
  students,
  onCreated,
}: {
  onClose: () => void;
  mentorId: string;
  students: any[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    student_id: '',
    title: '',
    description: '',
    priority: 'medium' as ReviewPriority,
    due_date: '',
    estimated_review_time: 30,
    tags: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!form.student_id || !form.title.trim()) {
      notifyError('Student and title are required');
      return;
    }
    setSubmitting(true);
    const { error } = await reviewService.create({
      student_id: form.student_id,
      mentor_id: mentorId,
      title: form.title,
      description: form.description,
      priority: form.priority,
      due_date: form.due_date || undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      estimated_review_time: form.estimated_review_time,
    });
    setSubmitting(false);
    if (error) { notifyError(error); return; }
    notifySuccess('Review created and assigned!');
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[40px] max-w-lg w-full p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">New Review</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assign a review to a student</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Student *</label>
            <select
              value={form.student_id}
              onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black"
            >
              <option value="">Select a student...</option>
              {students.map((s: any) => (
                <option key={s.user_id || s.id} value={s.user_id || s.id}>
                  {s.name || s.full_name || s.email}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Review Title *</label>
            <input
              type="text"
              placeholder="e.g. Portfolio Review, Module 1 Assessment..."
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Description</label>
            <textarea
              placeholder="What should the student review?"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black resize-none h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as ReviewPriority }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Est. Review Time (min)</label>
              <input
                type="number"
                value={form.estimated_review_time}
                onChange={e => setForm(f => ({ ...f, estimated_review_time: parseInt(e.target.value) || 30 }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tags (comma separated)</label>
              <input
                type="text"
                placeholder="portfolio, assessment"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-slate-600">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.student_id || !form.title.trim()}
            className="flex-1 py-4 bg-brand-charcoal text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin inline" /> : 'Assign Review'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function ReviewsTab({
  mentors,
  students,
}: {
  mentors: any[];
  students: any[];
}) {
  const { user } = useAuth();
  const { reviews, loading, updateStatus, deleteReview, bulkAction, refresh } = useReviews();
  const {
    filtered, allFiltered, totalPages, page, setPage,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    priorityFilter, setPriorityFilter,
    programFilter, setProgramFilter, programOptions,
    mentorFilter, setMentorFilter, mentorOptions,
    sortBy, setSortBy,
  } = useReviewFilters(reviews);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailReview, setDetailReview] = useState<Review | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [bulkActionType, setBulkActionType] = useState<'complete' | 'archive' | 'delete'>('complete');
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const counts: Record<string, number> = {};
    reviews.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    setStatusCounts(counts);
  }, [reviews]);

  const pendingReviews = useMemo(() =>
    reviews.filter(r => ['assigned', 'pending', 'submitted', 'in_review'].includes(r.status)),
  [reviews]);

  const completedReviews = useMemo(() =>
    reviews.filter(r => r.status === 'completed'),
  [reviews]);

  const isReallyEmpty = reviews.length === 0;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(r => r.id)));
    }
  };

  const handleBulkAction = async (action: 'complete' | 'archive' | 'delete') => {
    const ids = Array.from(selectedIds) as string[];
    if (action === 'complete') {
      const { error } = await bulkAction(ids, 'complete');
      if (error) { notifyError(error); return; }
    } else if (action === 'archive') {
      const { error } = await bulkAction(ids, 'archive');
      if (error) { notifyError(error); return; }
    } else if (action === 'delete') {
      const { error } = await bulkAction(ids, 'delete');
      if (error) { notifyError(error); return; }
    }
    notifySuccess(`${ids.length} reviews ${action === 'delete' ? 'deleted' : 'updated'}`);
    setSelectedIds(new Set());
    refresh();
  };

  const handleQuickApprove = async (id: string) => {
    const { error } = await updateStatus(id, 'completed');
    if (error) { notifyError(error); return; }
    notifySuccess('Review approved');
    refresh();
  };

  const handleQuickReject = async (id: string) => {
    const { error } = await updateStatus(id, 'submitted');
    if (error) { notifyError(error); return; }
    notifySuccess('Review returned for revision');
    refresh();
  };

  const statusTabs = [
    { key: 'all' as const, label: 'All', count: reviews.length },
    { key: 'assigned' as const, label: 'Assigned', count: statusCounts['assigned'] || 0 },
    { key: 'submitted' as const, label: 'Submitted', count: statusCounts['submitted'] || 0 },
    { key: 'in_review' as const, label: 'In Review', count: statusCounts['in_review'] || 0 },
    { key: 'completed' as const, label: 'Completed', count: statusCounts['completed'] || 0 },
    { key: 'archived' as const, label: 'Archived', count: statusCounts['archived'] || 0 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin text-slate-300" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Reviews</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {pendingReviews.length} pending • {completedReviews.length} completed • {reviews.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-3 bg-brand-charcoal text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-1.5"
          >
            <Plus size={14} /> New Review
          </button>
          <button
            onClick={refresh}
            className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className="text-slate-500" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-4 border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {statusTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                statusFilter === tab.key
                  ? 'bg-brand-charcoal text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label} {tab.count > 0 && <span className="ml-1 opacity-60">({tab.count})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student, title, program..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <select
            value={priorityFilter}
            onChange={e => { setPriorityFilter(e.target.value as ReviewPriority | 'all'); setPage(1); }}
            className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-bold outline-none focus:border-black"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {programOptions.length > 0 && (
            <select
              value={programFilter}
              onChange={e => { setProgramFilter(e.target.value); setPage(1); }}
              className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-bold outline-none focus:border-black max-w-[140px]"
            >
              <option value="all">All Programs</option>
              {programOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}

          {mentorOptions.length > 0 && (
            <select
              value={mentorFilter}
              onChange={e => { setMentorFilter(e.target.value); setPage(1); }}
              className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-bold outline-none focus:border-black max-w-[140px]"
            >
              <option value="all">All Mentors</option>
              {mentorOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-bold outline-none focus:border-black"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="due_date">Due Date</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-[20px] p-4 flex items-center justify-between">
          <p className="text-xs font-bold text-indigo-700">{selectedIds.size} selected</p>
          <div className="flex gap-2">
            <button
              onClick={() => { setBulkActionType('complete'); setShowBulkConfirm(true); }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700"
            >
              Complete All
            </button>
            <button
              onClick={() => { setBulkActionType('archive'); setShowBulkConfirm(true); }}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-600"
            >
              Archive All
            </button>
            <button
              onClick={() => { setBulkActionType('delete'); setShowBulkConfirm(true); }}
              className="px-4 py-2 bg-red-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600"
            >
              Delete All
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-2 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.size === filtered.length && filtered.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Select All</span>
          </label>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(review => (
            <div key={review.id} className="relative group/card">
              <ReviewCard
                review={review}
                selected={selectedIds.has(review.id)}
                onToggleSelect={() => toggleSelect(review.id)}
                onOpen={() => setDetailReview(review)}
                searchQuery={searchQuery}
              />
              {review.status === 'submitted' && (
                <div className="absolute top-2 right-12 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                  <button
                    onClick={e => { e.stopPropagation(); handleQuickApprove(review.id); }}
                    className="w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 shadow-sm"
                    title="Quick Approve"
                  >
                    <ThumbsUp size={12} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleQuickReject(review.id); }}
                    className="w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center hover:bg-amber-600 shadow-sm"
                    title="Quick Reject"
                  >
                    <ThumbsDown size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
            {isReallyEmpty ? <CheckCircle2 size={24} /> : <Search size={24} />}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {isReallyEmpty
              ? 'All caught up. No pending reviews.'
              : searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'No reviews match your filters.'
                : 'No reviews found.'}
          </p>
          {isReallyEmpty && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 px-6 py-3 bg-brand-charcoal text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
            >
              Create First Review
            </button>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-bold disabled:opacity-50 hover:bg-slate-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-xl text-[10px] font-bold ${
                p === page ? 'bg-brand-charcoal text-white' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-bold disabled:opacity-50 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      )}

      {detailReview && (
        <ReviewDetailModal
          review={detailReview}
          onClose={() => setDetailReview(null)}
          onUpdate={refresh}
        />
      )}

      {showCreate && (
        <CreateReviewModal
          onClose={() => setShowCreate(false)}
          mentorId={user?.id || ''}
          students={students}
          onCreated={refresh}
        />
      )}

      {showBulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => e.target === e.currentTarget && setShowBulkConfirm(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl text-center"
          >
            <AlertTriangle size={40} className="mx-auto mb-4 text-amber-500" />
            <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Confirm Bulk Action</h3>
            <p className="text-sm text-slate-500 font-medium mb-6">
              Are you sure you want to {bulkActionType} {selectedIds.size} review{selectedIds.size !== 1 ? 's' : ''}?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowBulkConfirm(false)} className="flex-1 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleBulkAction(bulkActionType);
                  setShowBulkConfirm(false);
                }}
                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:opacity-90 ${
                  bulkActionType === 'delete' ? 'bg-red-500' : 'bg-brand-charcoal'
                }`}
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
