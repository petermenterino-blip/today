import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Phone, Video, Search, Bell, BellOff, X, Check, Image as ImageIcon, FileText, Link as LinkIcon, Users, ArrowLeft } from 'lucide-react';
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
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeCallSim, setActiveCallSim] = useState<{ type: 'audio' | 'video'; name: string } | null>(null);
  const [muteConversationEnabled, setMuteConversationEnabled] = useState(false);
  const [showAddParticipantDropdown, setShowAddParticipantDropdown] = useState(false);

  const contactName = selectedConversation.isGroup 
    ? selectedConversation.name 
    : (role === 'mentor' ? selectedConversation.studentName : 'Peter Mannarino');
  const initials = contactName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';

  const handleActionClick = (actionName: string) => {
    setActiveCallSim({
      type: actionName.includes('Video') ? 'video' : 'audio',
      name: contactName
    });
  };

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
            title="Close panel"
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

          {/* 2. Quick Actions Card */}
          <div className="bg-white p-3 xl:p-4 shadow-sm border border-[#e9edef] rounded-[20px] w-full max-w-full box-border grid grid-cols-4 gap-1">
            <button 
              onClick={() => handleActionClick('Audio Call')}
              className="flex flex-col items-center justify-center gap-1 group/act focus:outline-none min-w-0"
            >
              <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-slate-50 text-indigo-600 flex items-center justify-center border border-slate-100 shadow-sm group-hover/act:bg-indigo-50 group-hover/act:text-indigo-700 group-hover/act:scale-105 transition-all duration-200 shrink-0">
                <Phone size={16} />
              </div>
              <span className="text-[10px] xl:text-[11px] font-semibold text-slate-600 group-hover/act:text-indigo-600 transition-colors truncate w-full text-center">Audio</span>
            </button>
            
            <button 
              onClick={() => handleActionClick('Video Call')}
              className="flex flex-col items-center justify-center gap-1 group/act focus:outline-none min-w-0"
            >
              <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-slate-50 text-indigo-600 flex items-center justify-center border border-slate-100 shadow-sm group-hover/act:bg-indigo-50 group-hover/act:text-indigo-700 group-hover/act:scale-105 transition-all duration-200 shrink-0">
                <Video size={16} />
              </div>
              <span className="text-[10px] xl:text-[11px] font-semibold text-slate-600 group-hover/act:text-indigo-600 transition-colors truncate w-full text-center">Video</span>
            </button>
            
            <button 
              onClick={() => {
                if (onShowToast) onShowToast("In-chat search enabled", 'info');
              }}
              className="flex flex-col items-center justify-center gap-1 group/act focus:outline-none min-w-0"
            >
              <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-slate-50 text-indigo-600 flex items-center justify-center border border-slate-100 shadow-sm group-hover/act:bg-indigo-50 group-hover/act:text-indigo-700 group-hover/act:scale-105 transition-all duration-200 shrink-0">
                <Search size={16} />
              </div>
              <span className="text-[10px] xl:text-[11px] font-semibold text-slate-600 group-hover/act:text-indigo-600 transition-colors truncate w-full text-center">Search</span>
            </button>
            
            <button 
              onClick={() => {
                setMuteConversationEnabled(!muteConversationEnabled);
                if (onShowToast) onShowToast(`Conversation ${!muteConversationEnabled ? 'muted' : 'unmuted'}`, 'info');
              }}
              className="flex flex-col items-center justify-center gap-1 group/act focus:outline-none min-w-0"
            >
              <div className={`w-9 h-9 xl:w-10 xl:h-10 rounded-full flex items-center justify-center border shadow-sm group-hover/act:scale-105 transition-all duration-200 shrink-0 ${muteConversationEnabled ? 'bg-amber-50 text-amber-600 border-amber-200 group-hover/act:bg-amber-100' : 'bg-slate-50 text-indigo-600 border-slate-100 group-hover/act:bg-indigo-50'}`}>
                {muteConversationEnabled ? <BellOff size={16} /> : <Bell size={16} />}
              </div>
              <span className={`text-[10px] xl:text-[11px] font-semibold transition-colors truncate w-full text-center ${muteConversationEnabled ? 'text-amber-600' : 'text-slate-600 group-hover/act:text-indigo-600'}`}>
                {muteConversationEnabled ? 'Muted' : 'Mute'}
              </span>
            </button>
          </div>

          {/* 3. About Card */}
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
                    {role === 'student' ? 'mentor-1' : (selectedConversation.studentId || 'student-1')}
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

      {/* Call Modal */}
      {activeCallSim && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-2xl max-w-sm w-full p-8 flex flex-col items-center text-center shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold mb-6 animate-pulse shadow-[0_0_30px_rgba(79,70,229,0.5)]">
              {activeCallSim.type === 'audio' ? <Phone size={36} /> : <Video size={36} />}
            </div>
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-1">Incoming {activeCallSim.type} call</p>
            <h4 className="text-xl font-bold mb-1">{activeCallSim.name}</h4>
            <p className="text-xs text-slate-400 mb-8">Calling via Mentorino Encrypted Audio...</p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setActiveCallSim(null);
                  if (onShowToast) onShowToast("Call declined", 'error');
                }}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all text-white rounded-full font-bold text-sm flex items-center gap-2 focus:outline-none"
              >
                <X size={16} /> Decline
              </button>
              
              <button 
                onClick={() => {
                  setActiveCallSim(null);
                  if (onShowToast) onShowToast("Call answered successfully", 'success');
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white rounded-full font-bold text-sm flex items-center gap-2 focus:outline-none"
              >
                <Check size={16} /> Answer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Gallery */}
      {galleryOpen && (() => {
        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex flex-col p-4 md:p-6 select-none animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-white pb-4 border-b border-white/10 max-w-5xl mx-auto w-full shrink-0">
              <div>
                <h3 className="font-bold text-lg">Media, Links & Docs</h3>
                <p className="text-xs text-slate-400">{contactName} • 39 items shared</p>
              </div>
              <button 
                onClick={() => setGalleryOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white focus:outline-none"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto w-full custom-scrollbar no-scrollbar">
              {[
                { title: "Career Flowchart.png", size: "1.2 MB", type: "image", bg: "from-blue-500 to-indigo-600" },
                { title: "Resume Blueprint.pdf", size: "850 KB", type: "document", bg: "from-amber-500 to-orange-600" },
                { title: "Mentor Intro Video.mp4", size: "14 MB", type: "video", bg: "from-emerald-500 to-teal-600" },
                { title: "Mock Interview Guide.docx", size: "450 KB", type: "document", bg: "from-blue-400 to-sky-600" },
                { title: "Portfolio_V2_Review.jpg", size: "2.4 MB", type: "image", bg: "from-purple-500 to-pink-600" },
                { title: "System_Architecture.pdf", size: "4.1 MB", type: "document", bg: "from-indigo-600 to-violet-700" },
                { title: "Useful_Resources_List.xlsx", size: "120 KB", type: "document", bg: "from-emerald-600 to-green-700" },
                { title: "GitHub Repo link", size: "github.com/mentorino", type: "link", bg: "from-slate-700 to-slate-900" },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-800 border border-white/5 rounded-xl overflow-hidden shadow-lg group hover:scale-[1.03] hover:border-white/20 transition-all duration-200 flex flex-col justify-between">
                  <div className={`h-32 bg-gradient-to-tr ${item.bg} flex items-center justify-center relative`}>
                    {item.type === 'image' && <ImageIcon size={32} className="text-white/80" />}
                    {item.type === 'video' && <Video size={32} className="text-white/80" />}
                    {item.type === 'document' && <FileText size={32} className="text-white/80" />}
                    {item.type === 'link' && <LinkIcon size={32} className="text-white/80" />}
                  </div>
                  <div className="p-3 bg-slate-900">
                    <p className="text-xs font-bold text-white truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </>
  );
};
