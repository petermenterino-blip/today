import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Users, ArrowLeft } from 'lucide-react';
import { Conversation } from '../../types/messaging';
import { StudentProfile } from '../../types';

interface ContactInfoPanelProps {
  show: boolean;
  selectedConversation: Conversation;
  role: 'student' | 'mentor';
  currentUserId: string;
  allStudents: StudentProfile[];
  avatarPreviews: Record<string, string>;
  onClose: () => void;
  onAddParticipant: (studentId: string) => void;
  onRemoveParticipant: (studentId: string) => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ContactInfoPanel: React.FC<ContactInfoPanelProps> = ({
  show,
  selectedConversation,
  role,
  currentUserId,
  allStudents,
  avatarPreviews,
  onClose,
  onAddParticipant,
  onRemoveParticipant,
  onShowToast,
}) => {
  const [showAddParticipantDropdown, setShowAddParticipantDropdown] = useState(false);

  const contactName = selectedConversation.isGroup 
    ? selectedConversation.name 
    : (role === 'mentor' ? selectedConversation.studentName : 'Peter Mannarino');
  const initials = contactName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';

  const handleAddParticipantClick = useCallback((studentId: string) => {
    onAddParticipant(studentId);
  }, [onAddParticipant]);

  const handleRemoveParticipantClick = useCallback((studentId: string) => {
    onRemoveParticipant(studentId);
  }, [onRemoveParticipant]);

  if (!show) return null;

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        className="absolute inset-0 bg-black/10 z-[990] transition-opacity duration-300 cursor-default"
        onClick={onClose}
      />

      {/* Contact Info Sliding Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full sm:w-[380px] sm:min-w-[380px] sm:max-w-[380px] bg-[#f0f2f5] border-l border-[#e9edef] flex flex-col h-full shrink-0 z-[1000] absolute right-0 top-0 bottom-0 shadow-[-16px_0_40px_rgba(0,0,0,0.12)] overflow-x-hidden overflow-y-hidden box-border animate-in slide-in-from-right duration-300"
      >
        {/* Sidebar Header */}
        <div className="h-[60px] bg-white px-4 flex items-center gap-4 border-b border-[#e9edef] shrink-0 box-border">
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-[#f0f2f5] rounded-full transition-colors text-[#54656f] focus:outline-none shrink-0"
            title="Close panel" aria-label="Close panel"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-base font-bold text-[#111b21] truncate">
            {selectedConversation.isGroup ? "Group Info" : "Contact Info"}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 xl:space-y-4 p-4 xl:p-5 custom-scrollbar no-scrollbar pb-8 w-full max-w-full box-border">
          
          {/* 1. Profile Card */}
          <div className="bg-white p-4 xl:p-5 flex flex-col items-center text-center shadow-sm border border-[#e9edef] rounded-[20px] w-full max-w-full box-border overflow-hidden">
            <div className="w-20 h-20 xl:w-24 xl:h-24 rounded-full relative overflow-hidden shrink-0 shadow-[0_8px_16px_-4px_rgba(99,102,241,0.25)] mb-3 xl:mb-4">
              {avatarPreviews[selectedConversation.id] ? (
                <img 
                  src={avatarPreviews[selectedConversation.id]} 
                  alt={contactName} 
                  className="w-full h-full object-cover rounded-full"
                  loading="lazy"
                />
              ) : selectedConversation.isGroup ? (
                <div className="w-full h-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-2xl xl:text-3xl font-black">
                  <Users size={40} />
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-2xl xl:text-3xl font-black">
                  <span>{initials}</span>
                </div>
              )}
            </div>
            
            <h3 className="text-lg xl:text-xl font-bold text-[#111b21] tracking-tight leading-tight w-full" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              {contactName}
            </h3>
            
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mt-1">
              {selectedConversation.isGroup ? "Group Chat" : (selectedConversation.mentorId === currentUserId || role === 'student' ? "Mentor" : "Student")}
            </p>
            
            <div className="flex items-center justify-center gap-1.5 mt-2 w-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <p className="text-xs text-[#667781] font-medium truncate max-w-full">
                {selectedConversation.isGroup 
                  ? `${selectedConversation.participants?.length || 0} participants` 
                  : role === 'student' 
                    ? "Online • Last seen today at 2:45 PM" 
                    : "Online • Active now"
                }
              </p>
            </div>
          </div>

          {/* 2. About Card */}
          <div className="bg-white p-4 xl:p-5 shadow-sm border border-[#e9edef] rounded-[20px] w-full max-w-full box-border space-y-2 overflow-hidden">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">About</h4>
            <p className="text-sm text-slate-800 font-medium leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              {selectedConversation.isGroup 
                ? (selectedConversation.description || "Helping students build careers with structured mentorship.")
                : (role === 'student' 
                    ? "Helping students build careers with structured mentorship." 
                    : "No bio available."
                  )
              }
            </p>
          </div>

          {/* Group Participants or Details Card */}
          {selectedConversation.isGroup ? (
            <div className="bg-white p-4 xl:p-5 shadow-sm border border-[#e9edef] rounded-[20px] w-full max-w-full box-border space-y-3 overflow-hidden">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 truncate mr-2">
                  Participants ({selectedConversation.participants?.length || 0})
                </h4>
                {role === 'mentor' && (
                  <button
                    onClick={() => setShowAddParticipantDropdown(!showAddParticipantDropdown)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-0.5 focus:outline-none shrink-0"
                  >
                    {showAddParticipantDropdown ? 'Cancel' : '+ Add'}
                  </button>
                )}
              </div>

              {role === 'mentor' && showAddParticipantDropdown && (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2 animate-in fade-in slide-in-from-top-1 mb-2 w-full box-border">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select student to add:</p>
                  <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1 custom-scrollbar no-scrollbar w-full">
                    {allStudents
                      .filter(s => !selectedConversation.participants?.includes(s.id) && !selectedConversation.participants?.includes(s.user_id))
                      .map(s => (
                        <button
                          key={s.id}
                          onClick={() => handleAddParticipantClick(s.id)}
                          className="w-full text-left p-2 hover:bg-indigo-50 rounded text-xs font-medium text-slate-700 flex items-center gap-2 transition-colors focus:outline-none"
                        >
                          <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-[10px] font-bold shrink-0">
                            {s.name?.charAt(0)}
                          </div>
                          <span className="truncate flex-1">{s.name}</span>
                          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold shrink-0">Add</span>
                        </button>
                      ))}
                    {allStudents.filter(s => !selectedConversation.participants?.includes(s.id) && !selectedConversation.participants?.includes(s.user_id)).length === 0 && (
                      <p className="text-[10px] text-slate-400 text-center py-2">All active students are already in this group.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar no-scrollbar w-full">
                {selectedConversation.participants?.map(pid => {
                  const isMentorParticipant = pid === selectedConversation.mentorId || pid.startsWith('mentor-') || pid === 'mentor';
                  const studentInfo = allStudents.find(s => s.id === pid || s.user_id === pid);
                  const name = isMentorParticipant ? 'Peter Mannarino (Mentor)' : (studentInfo?.name || `Student (${pid})`);
                  const initials = name.charAt(0);

                  return (
                    <div key={pid} className="flex items-center justify-between text-sm group/item py-1 w-full min-w-0 gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-semibold shrink-0 text-xs">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#111b21] truncate" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{name}</p>
                          <p className="text-[9px] text-[#667781] truncate">
                            {isMentorParticipant ? 'Group Admin' : 'Student'}
                          </p>
                        </div>
                      </div>

                      {role === 'mentor' && !isMentorParticipant && (
                        <button
                          onClick={() => handleRemoveParticipantClick(pid)}
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded shrink-0 transition-all focus:outline-none"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white p-4 xl:p-5 shadow-sm border border-[#e9edef] rounded-[20px] w-full max-w-full box-border space-y-3.5 overflow-hidden">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Details</h4>
              <div className="space-y-3.5 text-xs w-full">
                <div className="flex flex-col w-full">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Role</p>
                  <p className="font-semibold text-slate-800 mt-0.5" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {role === 'student' ? 'Mentor' : 'Student'}
                  </p>
                </div>
                
                <div className="flex flex-col w-full border-t border-slate-100 pt-2.5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    {role === 'student' ? 'Mentor ID' : 'Student ID'}
                  </p>
                  <p className="font-mono text-slate-700 font-semibold mt-0.5" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {role === 'student' ? (selectedConversation.mentorId || 'Mentor') : (selectedConversation.studentId || 'Student')}
                  </p>
                </div>

                <div className="flex flex-col w-full border-t border-slate-100 pt-2.5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Email</p>
                  <p className="font-semibold text-slate-800 mt-0.5" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {role === 'student' ? 'peter@mannarino.com' : 'student@email.com'}
                  </p>
                </div>

                <div className="flex flex-col w-full border-t border-slate-100 pt-2.5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Phone</p>
                  <p className="font-semibold text-slate-800 mt-0.5" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {role === 'student' ? '+1 (555) 234-5678' : '+91 XXXXX XXXXX'}
                  </p>
                </div>

                <div className="flex flex-col w-full border-t border-slate-100 pt-2.5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Location</p>
                  <p className="font-semibold text-slate-800 mt-0.5" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {role === 'student' ? 'San Francisco, USA' : 'India'}
                  </p>
                </div>

                <div className="flex flex-col w-full border-t border-slate-100 pt-2.5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Member Since</p>
                  <p className="font-semibold text-slate-800 mt-0.5" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {role === 'student' ? 'Sep 2025' : 'Jan 2026'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};
