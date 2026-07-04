import React, { useState, useMemo, useCallback } from 'react';
import { Search, Archive, MessageSquarePlus, X, Pin, BellOff, Users, MessageSquare } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { supabase } from '../../lib/supabase';
import { Conversation } from '../../types/messaging';
import { StudentProfile } from '../../types';
import { messageService } from '../../services/messageService';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  mutedConversations: string[];
  allStudents: StudentProfile[];
  role: 'student' | 'mentor';
  currentUserId: string;
  currentUserName?: string;
  onSelectConversation: (c: Conversation) => void;
  onPinConversation: (id: string, pinned: boolean) => void;
  onArchiveConversation: (id: string, archived: boolean) => void;
  onCreateConversation: (c: Conversation) => void;
}

export const ConversationList = React.memo<ConversationListProps>(({
  conversations,
  selectedConversationId,
  mutedConversations,
  allStudents,
  role,
  currentUserId,
  currentUserName,
  onSelectConversation,
  onPinConversation,
  onArchiveConversation,
  onCreateConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const activeConversations = useMemo(() => conversations.filter(c => !c.archived), [conversations]);
  const archivedConversations = useMemo(() => conversations.filter(c => c.archived), [conversations]);

  const getDisplayName = useCallback((c: Conversation) => {
    if (c.isGroup) return c.name || 'Group Chat';
    const otherName = role === 'mentor' ? (c.studentName || 'Unknown Student') : (c.mentorName || 'Unknown Mentor');
    return otherName;
  }, [role]);

  const filteredConversations = useMemo(() => {
    const source = showArchivedOnly ? archivedConversations : activeConversations;
    return source.filter(c => {
      const name = getDisplayName(c);
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [activeConversations, archivedConversations, showArchivedOnly, searchQuery, getDisplayName]);

  return (
    <div className="w-full md:w-[350px] lg:w-[400px] bg-white border-r border-[#d1d7db] flex flex-col">
      <div className="h-[60px] bg-[#f0f2f5] px-4 flex items-center justify-between border-b border-[#d1d7db] shrink-0">
        <h2 className="text-[19px] font-bold text-[#111b21] select-none">Chats</h2>
        <div className="flex items-center gap-3.5 text-[#54656f]">
          <button
            onClick={() => setShowArchivedOnly(!showArchivedOnly)}
            className={`p-1 hover:bg-slate-200 rounded-full transition-colors ${showArchivedOnly ? 'text-[#00a884]' : ''}`}
            title={showArchivedOnly ? "Show Active Chats" : "Show Archived Chats"}
          >
            <Archive size={20} className={showArchivedOnly ? "fill-[#00a884]/20" : ""} />
          </button>
          <button
            onClick={() => setShowNewChatModal(!showNewChatModal)}
            className="p-1 hover:bg-slate-200 rounded-full transition-colors"
            title="New Chat"
          >
            <MessageSquarePlus size={20} />
          </button>
        </div>
      </div>

      <div className="p-2 bg-white border-b border-[#f2f2f2]">
        <div className="bg-[#f0f2f5] rounded-lg flex items-center px-3 py-1.5 gap-3">
          <Search size={16} className="text-[#54656f]" />
          <input
            type="text"
            placeholder={showArchivedOnly ? "Search archived chats" : "Search or start new chat"}
            className="bg-transparent border-none outline-none w-full text-sm placeholder-[#54656f]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {showNewChatModal && (
          <div className="p-4 bg-slate-50 border-b border-emerald-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600">Start New Conversation</h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-slate-400 hover:text-slate-600" aria-label="Close"><X size={16} /></button>
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {role === 'mentor' ? (
                allStudents
                  .filter(s => !conversations.some(c => !c.isGroup && c.studentId === (s.id || s.user_id)))
                  .map(s => (
                    <button
                      key={s.id}
                      onClick={async () => {
                        const newC = await messageService.createConversation(s.id || s.user_id, s.name || '', currentUserId);
                        if (newC) onCreateConversation(newC);
                        setShowNewChatModal(false);
                      }}
                      className="w-full text-left p-2.5 hover:bg-emerald-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 transition-colors"
                    >
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-[10px]">
                        {s.name?.charAt(0)}
                      </div>
                      {s.name || 'Unnamed Student'}
                    </button>
                  ))
              ) : (
                <button
                  onClick={async () => {
                    const { data: enrollment } = await supabase
                      .from('program_enrollments')
                      .select('program:program_id(mentor_id)')
                      .eq('student_id', currentUserId)
                      .maybeSingle();
                    const mentorId = (enrollment as any)?.program?.mentor_id;
                    if (mentorId) {
                      const newC = await messageService.createConversation(currentUserId, currentUserName || 'Student', mentorId);
                      if (newC) onCreateConversation(newC);
                    }
                    setShowNewChatModal(false);
                  }}
                  className="w-full text-left p-2.5 hover:bg-emerald-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 transition-colors"
                >
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-[10px]">
                    M
                  </div>
                  Your Mentor
                </button>
              )}
              {role === 'mentor' && allStudents.filter(s => !conversations.some(c => !c.isGroup && c.studentId === (s.id || s.user_id))).length === 0 && (
                <p className="text-[10px] text-slate-400 py-2">All students already have open chats!</p>
              )}
            </div>
          </div>
        )}

        {filteredConversations.length === 0 && !showArchivedOnly ? (
          <EmptyState
            icon={<MessageSquare size={32} />}
            title="No Conversations"
            description="No conversations match your current filter. Start a new chat or adjust your search."
          />
        ) : (
          <>
            {filteredConversations.map(c => {
              const displayName = getDisplayName(c);
              const isSelected = selectedConversationId === c.id;
              const isUnread = c.unreadCount > 0;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectConversation(c)}
                  className={`flex items-center px-3 py-3 gap-3 cursor-pointer hover:bg-[#f5f6f6] transition-colors group relative ${isSelected ? 'bg-[#f0f2f5]' : ''}`}
                >
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 text-indigo-700 font-bold">
                    {c.isGroup ? <Users size={20} /> : (displayName || '').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0 border-b border-[#f2f2f2] pb-3 pt-1">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="text-[17px] font-normal text-[#111b21] truncate">{displayName}</h4>
                        {c.pinned && <Pin size={12} className="text-indigo-600 shrink-0 rotate-45 fill-indigo-600" />}
                        {mutedConversations.includes(c.id) && <BellOff size={12} className="text-slate-400 shrink-0" />}
                      </div>
                      <span className={`text-xs ${isUnread ? 'text-[#25d366] font-medium' : 'text-[#667781]'}`}>
                        {c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center relative">
                      <p className="text-sm text-[#667781] truncate pr-14">{c.lastMessage || 'No messages yet'}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isUnread && (
                          <span className="w-5 h-5 bg-[#25d366] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                            {c.unreadCount}
                          </span>
                        )}
                        <div className="absolute right-0 top-0.5 hidden group-hover:flex bg-[#f5f6f6] pl-2 items-center gap-1.5 text-slate-400 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPinConversation(c.id, !c.pinned);
                            }}
                            className="hover:text-indigo-600 p-0.5"
                            title={c.pinned ? "Unpin Chat" : "Pin Chat"}
                          >
                            <Pin size={14} className={c.pinned ? "fill-indigo-600 text-indigo-600" : ""} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onArchiveConversation(c.id, !c.archived);
                            }}
                            className="hover:text-indigo-600 p-0.5"
                            title={c.archived ? "Unarchive Chat" : "Archive Chat"}
                          >
                            <Archive size={14} className={c.archived ? "fill-slate-400 text-slate-400" : ""} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
});
