import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock, Video, User, BookOpen, Info, X, Edit2, Copy, Trash2, FileText, ExternalLink,
} from 'lucide-react';
import { Session, StudentProfile } from '../../../interfaces';
import { Program } from '../../../types';
import { getSessionStyle } from './calendarUtils';
import { notifySuccess } from '../../../utils/toast';
import type { CalendarTag } from './calendarUtils';

interface SessionDetailsModalProps {
  session: Session | null;
  onClose: () => void;
  onEdit: (session: Session) => void;
  onDuplicate: (session: Session) => void;
  onCancel: (session: Session) => void;
  onDelete: (session: Session) => void;
  getStudentForSession: (id: string) => StudentProfile | undefined;
  getProgramForSession: (id?: string) => Program | undefined;
  tags: CalendarTag[];
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  session,
  onClose,
  onEdit,
  onDuplicate,
  onCancel,
  onDelete,
  getStudentForSession,
  getProgramForSession,
  tags,
}) => {
  const [previewStudent, setPreviewStudent] = useState<StudentProfile | null>(null);
  const [previewProgram, setPreviewProgram] = useState<Program | null>(null);

  if (!session) return null;

  const handleClose = () => {
    setPreviewStudent(null);
    setPreviewProgram(null);
    onClose();
  };

  const student = getStudentForSession(session.studentId);
  const program = getProgramForSession(session.programId);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-[40px] border border-slate-100 shadow-2xl w-full max-w-xl overflow-hidden"
        >
          <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border"
                style={getSessionStyle(session.sessionType, session.status, tags).style}
              >
                {session.sessionType || '1:1'} Session
              </span>
              {session.status === 'cancelled' && (
                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                  Cancelled
                </span>
              )}
            </div>
            <button onClick={handleClose} className="p-2.5 bg-white hover:bg-slate-100 rounded-full transition-all border border-slate-100">
              <X size={16} />
            </button>
          </div>

          <div className="p-8 space-y-6">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800">{session.title}</h3>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-2">
                <Clock size={14} className="text-indigo-500" />
                <span>
                  {new Date(session.startTime).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
                <span>&bull;</span>
                <span>
                  {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Student</p>
                  <p className="font-bold text-sm text-slate-800 mt-1">
                    {student?.name || 'Alex Student'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const s = getStudentForSession(session.studentId);
                    if (s) setPreviewStudent(previewStudent?.id === s.id ? null : s);
                  }}
                  className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest text-left mt-3 flex items-center gap-1"
                >
                  <User size={10} /> {previewStudent ? 'Hide' : 'View Profile Details'}
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Program</p>
                  <p className="font-bold text-sm text-slate-800 mt-1 truncate">
                    {program?.title || 'Associated Program'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const p = getProgramForSession(session.programId);
                    if (p) setPreviewProgram(previewProgram?.id === p.id ? null : p);
                  }}
                  className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest text-left mt-3 flex items-center gap-1"
                >
                  <BookOpen size={10} /> {previewProgram ? 'Hide' : 'View Program Details'}
                </button>
              </div>
            </div>

            {previewStudent && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-3xl text-xs space-y-2 relative"
              >
                <button onClick={() => setPreviewStudent(null)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-700">
                  <X size={12} />
                </button>
                <h5 className="font-black text-[10px] text-indigo-900 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Info size={11} /> Student Stats Profile
                </h5>
                <p className="font-bold text-slate-800">Email: <span className="font-medium text-slate-600">{previewStudent.email}</span></p>
                <p className="font-bold text-slate-800">Health Status: <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                  previewStudent.healthStatus === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>{previewStudent.healthStatus}</span></p>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-100/40 font-bold text-slate-600 text-[10px]">
                  <div>
                    <span className="block text-slate-400 font-bold text-[8px] uppercase">Attendance</span>
                    <span className="text-slate-800 font-mono text-xs">{previewStudent.metrics.attendanceRate}%</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold text-[8px] uppercase">Goal Progress</span>
                    <span className="text-slate-800 font-mono text-xs">{previewStudent.metrics.goalCompletionRate}%</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold text-[8px] uppercase">Activity</span>
                    <span className="text-slate-800 font-mono text-xs">{previewStudent.metrics.activityLevel}%</span>
                  </div>
                </div>
              </motion.div>
            )}

            {previewProgram && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-3xl text-xs space-y-2 relative"
              >
                <button onClick={() => setPreviewProgram(null)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-700">
                  <X size={12} />
                </button>
                <h5 className="font-black text-[10px] text-indigo-900 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <BookOpen size={11} /> Program Info
                </h5>
                <p className="font-bold text-indigo-900 text-sm">{previewProgram.title}</p>
                <p className="text-slate-600 text-[11px] leading-relaxed">{previewProgram.description}</p>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 pt-1">
                  <span>Duration: {previewProgram.duration || '6 weeks'}</span>
                  <span>Difficulty: {previewProgram.difficulty || 'Intermediate'}</span>
                </div>
              </motion.div>
            )}

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Meeting Platform</p>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 capitalize">
                  <Video size={13} className="text-slate-400" />
                  {session.meetingType || 'Google Meet'}
                </span>
              </div>

              {session.meetingUrl ? (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/40">
                  <input
                    type="text"
                    readOnly
                    value={session.meetingUrl}
                    className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono text-indigo-600 flex-1 outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(session.meetingUrl || '');
                      notifySuccess("Meeting URL copied to clipboard.");
                    }}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                    title="Copy URL"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={() => window.open(session.meetingUrl, '_blank')}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md shadow-indigo-600/10"
                  >
                    <ExternalLink size={11} /> Join
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 font-semibold italic text-center py-1">No video link has been configured for this offline/custom event.</p>
              )}
            </div>

            {session.notes && (
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Session Agenda & Notes</p>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-600 leading-relaxed max-h-24 overflow-y-auto">
                  {session.notes}
                </div>
              </div>
            )}

            {session.attachedFiles && (
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Attached Files</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {session.attachedFiles.split(',').map((f, i) => (
                    <div key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-bold border border-slate-200 flex items-center gap-1 shadow-sm">
                      <FileText size={11} className="text-slate-400" />
                      <span>{f.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(session)}
                className="p-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
                title="Edit Session Details"
              >
                <Edit2 size={13} /> Edit
              </button>
              <button
                onClick={() => onDuplicate(session)}
                className="p-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
                title="Duplicate Session for Next Week"
              >
                <Copy size={13} /> Duplicate
              </button>
            </div>

            <div className="flex items-center gap-2">
              {session.status !== 'cancelled' && (
                <button
                  onClick={() => onCancel(session)}
                  className="px-4 py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest"
                >
                  Cancel Session
                </button>
              )}
              <button
                onClick={() => onDelete(session)}
                className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl transition-all"
                title="Delete Permanently"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
