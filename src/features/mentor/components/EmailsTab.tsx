import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Mail, Send, Settings2, Save, Loader2, CheckCircle2, XCircle,
  Users, ChevronRight, Eye, EyeOff, User as UserIcon
} from 'lucide-react';
import { EmailTemplate } from '../../../types/email';
import { emailTemplateService } from '../../../services/emailTemplateService';
import { notifySuccess, notifyError } from '../../../utils/toast';
import { StudentProfile } from '../../../types';

interface EmailsTabProps {
  studentProfiles: StudentProfile[];
  currentUser: { id?: string; name?: string; email?: string } | null;
}

const TEMPLATE_CARDS = [
  { key: 'application_submitted', label: 'Submitted', desc: 'Sent when a student applies' },
  { key: 'application_approved', label: 'Approved', desc: 'Welcome email on approval' },
  { key: 'application_rejected', label: 'Rejected', desc: 'Sent on application rejection' },
  { key: 'broadcast', label: 'Broadcast', desc: 'Mass email to students' },
];

const AVAILABLE_VARIABLES = [
  '{{name}}', '{{email}}', '{{programTitle}}', '{{feedback}}',
  '{{message}}', '{{senderName}}', '{{tempPassword}}',
];

export const EmailsTab: React.FC<EmailsTabProps> = ({ studentProfiles, currentUser }) => {
  const [subTab, setSubTab] = useState<'templates' | 'broadcast'>('templates');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [saving, setSaving] = useState(false);

  const [broadcastTemplateKey, setBroadcastTemplateKey] = useState('broadcast');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const broadcastBodyRef = useRef<HTMLTextAreaElement>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await emailTemplateService.fetchAll();
    if (error) notifyError(error);
    else setTemplates(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const selectedTemplate = templates.find(t => t.key === selectedKey);

  const handleSelectTemplate = (key: string) => {
    if (selectedKey === key) {
      setSelectedKey(null);
      return;
    }
    setSelectedKey(key);
    const tmpl = templates.find(t => t.key === key);
    if (tmpl) {
      setEditSubject(tmpl.subject);
      setEditBody(tmpl.body);
    }
  };

  const handleSaveTemplate = async () => {
    if (!selectedKey || !editSubject.trim() || !editBody.trim()) return;
    setSaving(true);
    const { error } = await emailTemplateService.update(selectedKey, {
      subject: editSubject.trim(),
      body: editBody.trim(),
    });
    if (error) notifyError(error);
    else {
      notifySuccess('Template saved');
      setTemplates(prev => prev.map(t =>
        t.key === selectedKey
          ? { ...t, subject: editSubject.trim(), body: editBody.trim(), updated_at: new Date().toISOString() }
          : t
      ));
    }
    setSaving(false);
  };

  const insertVariable = (target: 'edit' | 'broadcast', variable: string) => {
    if (target === 'edit' && bodyRef.current) {
      const start = bodyRef.current.selectionStart;
      const end = bodyRef.current.selectionEnd;
      const newBody = editBody.slice(0, start) + variable + editBody.slice(end);
      setEditBody(newBody);
      setTimeout(() => {
        bodyRef.current?.focus();
        bodyRef.current?.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else if (target === 'broadcast' && broadcastBodyRef.current) {
      const start = broadcastBodyRef.current.selectionStart;
      const end = broadcastBodyRef.current.selectionEnd;
      const newBody = broadcastBody.slice(0, start) + variable + broadcastBody.slice(end);
      setBroadcastBody(newBody);
      setTimeout(() => {
        broadcastBodyRef.current?.focus();
        broadcastBodyRef.current?.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const handleSelectBroadcastTemplate = (key: string) => {
    setBroadcastTemplateKey(key);
    const tmpl = templates.find(t => t.key === key);
    if (tmpl) {
      setBroadcastSubject(tmpl.subject);
      setBroadcastBody(tmpl.body);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(studentProfiles.map(p => p.email || p.user_email || '').filter(Boolean));
    }
    setSelectAll(!selectAll);
  };

  const toggleRecipient = (email: string) => {
    setSelectedEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
    setSelectAll(false);
  };

  const handleSendBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastBody.trim()) {
      notifyError('Subject and body are required');
      return;
    }
    if (selectedEmails.length === 0) {
      notifyError('Select at least one recipient');
      return;
    }
    setSending(true);

    const template: EmailTemplate = {
      id: '',
      key: broadcastTemplateKey,
      subject: broadcastSubject.trim(),
      body: broadcastBody.trim(),
      variables: [],
      updated_at: new Date().toISOString(),
    };

    const recipients = studentProfiles
      .filter(p => selectedEmails.includes(p.email || p.user_email || ''))
      .map(p => ({ email: p.email || p.user_email || '', name: p.name || p.full_name || 'Student' }));

    const result = await emailTemplateService.sendBroadcast(
      broadcastTemplateKey,
      recipients,
      { message: '', senderName: currentUser?.name || 'Mentor' }
    );

    setSending(false);
    if (result.sent > 0) notifySuccess(`Sent to ${result.sent} recipients`);
    if (result.errors > 0) notifyError(`Failed to send to ${result.errors} recipient(s)`);
  };

  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-slate-300" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">Emails</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Manage email templates and send broadcasts</p>
        </div>
      </div>

      <div className="flex border-b border-slate-100 gap-1">
        {(['templates', 'broadcast'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`px-5 py-3 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              subTab === tab ? 'border-black text-black' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'templates' ? <Settings2 size={14} /> : <Send size={14} />}
            {tab === 'templates' ? 'Templates' : 'Broadcast'}
          </button>
        ))}
      </div>

      {subTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Templates</p>
            {TEMPLATE_CARDS.map(card => {
              const tmpl = templates.find(t => t.key === card.key);
              const isSelected = selectedKey === card.key;
              return (
                <motion.div
                  key={card.key}
                  layout
                  onClick={() => handleSelectTemplate(card.key)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-black bg-slate-50 shadow-sm'
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        card.key === 'application_submitted' ? 'bg-blue-50 text-blue-600'
                        : card.key === 'application_approved' ? 'bg-emerald-50 text-emerald-600'
                        : card.key === 'application_rejected' ? 'bg-red-50 text-red-600'
                        : 'bg-purple-50 text-purple-600'
                      }`}>
                        <Mail size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{card.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{card.desc}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className={`text-slate-300 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </div>
                  {tmpl && (
                    <p className="text-[10px] text-slate-400 mt-3 font-mono truncate">
                      {tmpl.subject}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div>
            {selectedTemplate ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5 sticky top-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Editor — {selectedKey}</p>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Subject</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={e => setEditSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:border-black transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Variables</label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_VARIABLES.map(v => (
                      <button
                        key={v}
                        onClick={() => insertVariable('edit', v)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-600 transition-all"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Body (HTML)</label>
                  <textarea
                    ref={bodyRef}
                    value={editBody}
                    onChange={e => setEditBody(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono font-medium outline-none focus:border-black transition-all resize-y"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSaveTemplate}
                    disabled={saving || !editSubject.trim() || !editBody.trim()}
                    className="flex-1 py-3 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Changes
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Preview</p>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_p]:mb-1 [&_strong]:font-bold" dangerouslySetInnerHTML={{
                    __html: editBody.replace(/\{\{(\w+)\}\}/g, '<span class="text-blue-500 bg-blue-50 px-1 rounded">$1</span>')
                  }} />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <Settings2 size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select a template</p>
                <p className="text-xs text-slate-400 mt-1">Choose a template from the left to edit its subject and body.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Compose</p>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Template</label>
                <select
                  value={broadcastTemplateKey}
                  onChange={e => handleSelectBroadcastTemplate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:border-black transition-all"
                >
                  {templates.map(t => (
                    <option key={t.key} value={t.key}>{t.key}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Subject</label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={e => setBroadcastSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:border-black transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Variables</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_VARIABLES.map(v => (
                    <button
                      key={v}
                      onClick={() => insertVariable('broadcast', v)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-600 transition-all"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Body (HTML)</label>
                <textarea
                  ref={broadcastBodyRef}
                  value={broadcastBody}
                  onChange={e => setBroadcastBody(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono font-medium outline-none focus:border-black transition-all resize-y"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Recipients</p>
                <p className="text-xs font-bold text-slate-500">{selectedEmails.length} of {studentProfiles.length} selected</p>
              </div>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-all">
                <input
                  type="checkbox"
                  checked={selectAll && selectedEmails.length === studentProfiles.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black"
                />
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-slate-500" />
                  <span className="text-sm font-bold text-slate-700">Select All ({studentProfiles.length} students)</span>
                </div>
              </label>

              <div className="max-h-[320px] overflow-y-auto custom-scrollbar space-y-1">
                {studentProfiles.map(p => {
                  const email = p.email || p.user_email || '';
                  if (!email) return null;
                  const checked = selectedEmails.includes(email);
                  return (
                    <label
                      key={p.user_id || p.id || email}
                      className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                        checked ? 'bg-slate-50 border border-slate-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRecipient(email)}
                        className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black"
                      />
                      <UserIcon size={14} className="text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{p.name || p.full_name || 'Student'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{email}</p>
                      </div>
                    </label>
                  );
                })}
                {studentProfiles.length === 0 && (
                  <p className="text-center py-8 text-xs text-slate-400 font-medium">No students enrolled yet.</p>
                )}
              </div>
            </div>

            <button
              onClick={handleSendBroadcast}
              disabled={sending || selectedEmails.length === 0 || !broadcastSubject.trim() || !broadcastBody.trim()}
              className="w-full py-4 bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-black/10"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {sending ? 'Sending...' : `Send Broadcast (${selectedEmails.length})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
