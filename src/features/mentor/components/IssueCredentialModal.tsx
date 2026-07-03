import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Award } from 'lucide-react';
import { credentialService } from '../../../services/credentialService';
import { notifySuccess, notifyError } from '../../../utils/toast';

interface IssueCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  mentorName: string;
  onIssued: () => void;
}

const IssueCredentialModal: React.FC<IssueCredentialModalProps> = ({
  isOpen, onClose, studentId, studentName, mentorName, onIssued,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'badge' | 'certificate' | 'award'>('badge');
  const [saving, setSaving] = useState(false);

  const handleIssue = async () => {
    if (!title.trim() || !studentId) return;
    setSaving(true);
    try {
      const result = await credentialService.issue({
        student_id: studentId,
        title: title.trim(),
        description: description.trim(),
        issued_by: mentorName,
        type,
      });
      if (result) {
        notifySuccess(`Credential issued to ${studentName}`);
        setTitle('');
        setDescription('');
        onIssued();
        onClose();
      } else {
        notifyError('Failed to issue credential');
      }
    } catch {
      notifyError('Something went wrong');
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
        className="bg-white rounded-[40px] max-w-lg w-full p-10 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
          <X size={18} />
        </button>

        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award size={28} className="text-amber-600" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter">Issue Credential</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
            Award {studentName}
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Type</label>
            <select
              className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all"
              value={type}
              onChange={e => setType(e.target.value as any)}
            >
              <option value="badge">Badge</option>
              <option value="certificate">Certificate</option>
              <option value="award">Award</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Title *</label>
            <input type="text" placeholder="e.g. Portfolio Excellence" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Description</label>
            <textarea rows={3} placeholder="Why is this credential being issued?" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all resize-none" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="pt-4 flex gap-3">
            <button onClick={onClose} className="flex-1 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-slate-600">Cancel</button>
            <button
              onClick={handleIssue}
              disabled={!title.trim() || saving}
              className="flex-1 py-4 bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50"
            >
              {saving ? 'Issuing...' : 'Issue Credential'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default IssueCredentialModal;
