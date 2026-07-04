import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock, CheckCircle2, AlertCircle, Star, MessageSquare,
  Calendar, ArrowRight, Loader2, X, Send, FileText,
  BookOpen, Target, Flag, Flame, ArrowUpDown, Save
} from 'lucide-react';
import { Review } from '../../interfaces';
import { useReviews } from '../../hooks/useReviews';
import { reviewService } from '../../services/reviewService';
import { notifySuccess, notifyError } from '../../utils/toast';

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Draft', icon: <FileText size={12} /> },
  assigned: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Assigned', icon: <Clock size={12} /> },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending', icon: <Clock size={12} /> },
  submitted: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Submitted', icon: <Send size={12} /> },
  in_review: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'In Review', icon: <MessageSquare size={12} /> },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed', icon: <CheckCircle2 size={12} /> },
  archived: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Archived', icon: <FileText size={12} /> },
};

function ReviewDetail({ review: initialReview, onClose }: { review: Review; onClose: () => void }) {
  const { updateReview } = useReviews();
  const [review, setReview] = useState(initialReview);
  const [response, setResponse] = useState(review.student_response || '');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    reviewService.getHistory(review.id).then(h => { setHistory(h); setLoadingHistory(false); });
  }, [review.id]);

  const autoSave = useCallback(async (text: string) => {
    setSaving(true);
    await updateReview(review.id, { student_response: text });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [review.id, updateReview]);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const canEdit = ['assigned', 'pending'].includes(review.status);
    if (!canEdit) return;
    if (response === (initialReview.student_response || '')) return;
    saveTimer.current = setTimeout(() => autoSave(response), 1500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [response, review.status, initialReview.student_response, autoSave]);

  const handleSubmit = async () => {
    setSubmitting(true);
    const { error } = await reviewService.updateStatus(review.id, 'submitted', { student_response: response });
    setSubmitting(false);
    if (error) { notifyError(error); return; }
    setReview(prev => ({ ...prev, status: 'submitted', student_response: response, completion_percentage: 50 }));
    notifySuccess('Review submitted!');
  };

  const canEdit = ['assigned', 'pending'].includes(review.status);
  const canSubmit = canEdit && response.trim().length > 0;
  const isCompleted = review.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[40px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-white z-10 p-8 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black uppercase tracking-tighter">{review.title}</h2>
              <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full ${STATUS_CONFIG[review.status]?.bg} ${STATUS_CONFIG[review.status]?.text}`}>
                {STATUS_CONFIG[review.status]?.label}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {review.mentor_name || 'Mentor'} • {review.program_name || 'No Program'}
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</p>
              <p className="text-sm font-bold mt-1 capitalize">{review.status.replace('_', ' ')}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Progress</p>
              <p className="text-sm font-bold mt-1">{review.completion_percentage}%</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Priority</p>
              <p className="text-sm font-bold mt-1 capitalize">{review.priority}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Due</p>
              <p className="text-sm font-bold mt-1">{review.due_date ? new Date(review.due_date).toLocaleDateString() : 'No due date'}</p>
            </div>
          </div>

          {review.description && (
            <div className="p-6 bg-slate-50 rounded-3xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Description</p>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">{review.description}</p>
            </div>
          )}

          {isCompleted && review.feedback && (
            <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-2">Mentor Feedback</p>
              <p className="text-sm font-medium text-emerald-800 leading-relaxed">{review.feedback}</p>
              {review.rating && (
                <div className="flex items-center gap-1 mt-3">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={16} className={i < (review.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                  ))}
                  <span className="text-xs font-bold text-amber-600 ml-2">{review.rating}/5</span>
                </div>
              )}
            </div>
          )}

          {isCompleted && review.mentor_response && (
            <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 mb-2">Mentor Response</p>
              <p className="text-sm font-medium text-indigo-800 leading-relaxed">{review.mentor_response}</p>
            </div>
          )}

          {review.student_response && !canEdit && !isCompleted && (
            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-2">Your Submission</p>
              <p className="text-sm font-medium text-blue-800 leading-relaxed">{review.student_response}</p>
            </div>
          )}

          {(canEdit || (review.student_response && canEdit)) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Your Response</p>
                <div className="flex items-center gap-2">
                  {saving && <span className="text-[9px] text-slate-400 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Saving...</span>}
                  {saved && <span className="text-[9px] text-emerald-500 flex items-center gap-1"><Save size={10} /> Saved</span>}
                </div>
              </div>
              <textarea
                value={response}
                onChange={e => setResponse(e.target.value)}
                placeholder="Write your response, reflections, or completed work..."
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl min-h-[120px] text-sm font-medium outline-none focus:border-black transition-all resize-none"
              />
              {canSubmit && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-4 bg-brand-charcoal text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin inline" /> : 'Submit for Review'}
                </button>
              )}
            </div>
          )}

          {history.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Timeline</p>
              <div className="space-y-2">
                {history.map((h: any) => (
                  <div key={h.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                    <p className="text-xs font-bold text-slate-700">
                      {h.from_status || 'Created'} → {h.to_status}
                    </p>
                    <p className="text-[9px] text-slate-400 ml-auto shrink-0">
                      {new Date(h.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function StudentReviews() {
  const { reviews, loading, refresh } = useReviews();
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  const activeReviews = reviews.filter(r => !['completed', 'archived'].includes(r.status));
  const completedReviews = reviews.filter(r => r.status === 'completed');
  const filteredReviews = filter === 'all' ? reviews : filter === 'active' ? activeReviews : completedReviews;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin text-slate-300" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tighter">My Reviews</h2>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {activeReviews.length} active • {completedReviews.length} completed
        </p>
      </div>

      <div className="flex gap-2">
        {[
          { key: 'active' as const, label: 'Active', count: activeReviews.length },
          { key: 'completed' as const, label: 'Completed', count: completedReviews.length },
          { key: 'all' as const, label: 'All', count: reviews.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              filter === tab.key ? 'bg-brand-charcoal text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {filteredReviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map(review => {
            const isOverdue = review.due_date && new Date(review.due_date) < new Date() && !['completed', 'archived'].includes(review.status);
            const sc = STATUS_CONFIG[review.status];
            const hasFeedback = review.status === 'completed' && (review.feedback || review.mentor_response);
            return (
              <motion.div
                key={review.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedReview(review)}
                className={`bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group ${
                  isOverdue ? 'border-l-4 border-l-red-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {review.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">{review.mentor_name || 'Mentor'} • {review.program_name || ''}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-full ${sc?.bg} ${sc?.text} flex items-center gap-1 shrink-0`}>
                    {sc?.icon} {sc?.label}
                  </span>
                </div>

                {review.description && (
                  <p className="text-[10px] text-slate-500 font-medium line-clamp-2 mb-3">{review.description}</p>
                )}

                <div className="flex items-center gap-3 flex-wrap text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>{review.priority}</span>
                  {review.due_date && (
                    <span className={isOverdue ? 'text-red-500' : ''}>
                      <Calendar size={10} className="inline mr-1" />
                      {new Date(review.due_date).toLocaleDateString()}
                    </span>
                  )}
                  <span>{review.completion_percentage}%</span>
                </div>

                {hasFeedback && (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-2xl">
                    <div className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                      <MessageSquare size={10} /> Feedback Available
                    </div>
                    <p className="text-[10px] text-emerald-800 font-medium line-clamp-2">{review.feedback || review.mentor_response}</p>
                    {review.rating && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} size={10} className={i < (review.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {isOverdue && (
                  <div className="mt-2 flex items-center gap-1 text-[9px] font-black text-red-500 uppercase tracking-wider">
                    <AlertCircle size={10} /> Overdue
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
            <CheckCircle2 size={24} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {filter === 'active' ? 'No active reviews. You\'re all caught up!' : 'No reviews yet.'}
          </p>
        </div>
      )}

      {selectedReview && (
        <ReviewDetail
          review={selectedReview}
          onClose={() => { setSelectedReview(null); refresh(); }}
        />
      )}
    </div>
  );
}
