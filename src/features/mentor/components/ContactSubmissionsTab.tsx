import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Loader2, Mail, CheckCircle2, Archive, X, MessageSquare, Eye, RefreshCw,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { contactSubmissionService, ContactSubmission } from '../../../services/contactSubmissionService';
import { notifySuccess, notifyError } from '../../../utils/toast';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'read', label: 'Read' },
  { id: 'archived', label: 'Archived' },
];

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-indigo-100 text-indigo-700',
  read: 'bg-slate-100 text-slate-700',
  archived: 'bg-gray-100 text-gray-500',
};

export const ContactSubmissionsTab: React.FC = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<ContactSubmission | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await contactSubmissionService.fetchAll({
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: search || undefined,
    });
    if (error) { notifyError('Failed to load submissions'); } else { setSubmissions(data || []); }
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  useEffect(() => {
    const channel = supabase
      .channel('contact_submissions_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contact_submissions' }, (payload) => {
        setSubmissions(prev => [payload.new as ContactSubmission, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contact_submissions' }, (payload) => {
        setSubmissions(prev => prev.map(s => s.id === payload.new.id ? payload.new as ContactSubmission : s));
        setSelected(prev => prev?.id === payload.new.id ? payload.new as ContactSubmission : prev);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const stats = useMemo(() => ({
    new: submissions.filter(s => s.status === 'new').length,
    read: submissions.filter(s => s.status === 'read').length,
    archived: submissions.filter(s => s.status === 'archived').length,
    total: submissions.length,
  }), [submissions]);

  const handleMarkRead = async (id: string) => {
    const { error } = await contactSubmissionService.updateStatus(id, 'read');
    if (error) { notifyError('Failed to update'); return; }
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: 'read' as const } : s));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: 'read' } : null);
    notifySuccess('Marked as read');
  };

  const handleArchive = async (id: string) => {
    const { error } = await contactSubmissionService.updateStatus(id, 'archived');
    if (error) { notifyError('Failed to archive'); return; }
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: 'archived' as const } : s));
    if (selected?.id === id) setSelected(null);
    notifySuccess('Archived');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">Contact Submissions</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Messages from the website contact form</p>
        </div>
        <button onClick={fetchSubmissions} className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'New', value: stats.new, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Read', value: stats.read, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Archived', value: stats.archived, color: 'text-gray-500', bg: 'bg-gray-50' },
          { label: 'Total', value: stats.total, color: 'text-slate-900', bg: 'bg-slate-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-transparent`}>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search name, email, subject..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {STATUS_FILTERS.map(f => (
          <button key={f.id} onClick={() => setStatusFilter(f.id)} className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f.id ? 'bg-black text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'}`}>{f.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16"><Mail size={32} className="mx-auto text-slate-200 mb-3" /><p className="text-sm font-bold text-slate-300 uppercase tracking-widest">No submissions found</p></div>
          ) : submissions.map(s => (
            <motion.div key={s.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => setSelected(s)} className={`p-4 rounded-2xl border cursor-pointer transition-all ${selected?.id === s.id ? 'border-black bg-white shadow-lg' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold truncate">{s.name}</span>
                    {s.status !== 'archived' && <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${STATUS_BADGE[s.status] || ''}`}>{s.status}</span>}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{s.email}{s.subject ? ` — ${s.subject}` : ''}</p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{s.message}</p>
                  <p className="text-[10px] text-slate-300 mt-2">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-lg h-fit sticky top-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">{selected.name}</h3>
                  <p className="text-xs text-slate-500">{selected.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${STATUS_BADGE[selected.status] || ''}`}>{selected.status}</span>
              </div>
              {selected.subject && <p className="text-sm font-bold text-slate-700 mb-2">Re: {selected.subject}</p>}
              {selected.discipline && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{selected.discipline}</p>}
              <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
              </div>
              {selected.createdAt && <p className="text-[10px] text-slate-400 mb-4">Submitted {new Date(selected.createdAt).toLocaleString()}</p>}
              <div className="flex gap-2">
                {selected.status === 'new' && (
                  <button onClick={() => handleMarkRead(selected.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                    <Eye size={14} /> Mark as Read
                  </button>
                )}
                {selected.status !== 'archived' && (
                  <button onClick={() => handleArchive(selected.id)} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                    <Archive size={14} /> Archive
                  </button>
                )}
                <button onClick={() => setSelected(null)} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                  <X size={14} /> Close
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden lg:flex flex-col items-center justify-center py-24 bg-white rounded-[32px] border border-slate-100">
              <MessageSquare size={40} className="text-slate-200 mb-4" />
              <p className="text-sm font-black uppercase tracking-widest text-slate-300">Select a submission</p>
              <p className="text-xs text-slate-300 mt-1">Click on a message to view details</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
