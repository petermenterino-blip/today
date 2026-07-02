import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { messageService } from '../../services/messageService';
import { studentService } from '../../services/studentService';
import { useRealtime } from '../../hooks/useRealtime';
import { Message, Conversation } from '../../types/messaging';
import { StudentProfile } from '../../types';
import { ConversationList } from './ConversationList';
import { ConversationHeader } from './ConversationHeader';
import { MessageThread } from './MessageThread';
import { ComposeBar } from './ComposeBar';
import { ContactInfoPanel } from './ContactInfoPanel';

interface WhatsAppMessagingProps {
  role: 'student' | 'mentor';
  currentUserId: string;
  currentUserName?: string;
}

const WhatsAppMessaging: React.FC<WhatsAppMessagingProps> = ({ role, currentUserId, currentUserName }) => {
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [mutedConversations] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [avatarPreviews] = useState<Record<string, string>>(() => {
    const stored: Record<string, string> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('avatar_')) {
          stored[key.substring(7)] = localStorage.getItem(key) || '';
        }
      }
    } catch (e) {
      console.error(e);
    }
    return stored;
  });

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const studentIdParam = params.get('studentId');

    if (studentIdParam) {
      messageService.getConversations(currentUserId, role).then(allConvos => {
        const targetConvo = allConvos.find(c => c.studentId === studentIdParam);
        if (targetConvo && targetConvo.id !== selectedConversation?.id) {
          setSelectedConversation(targetConvo);
          messageService.getMessages(targetConvo.id).then(setMessages);
          messageService.markAsRead(targetConvo.id);
          setShowGroupInfo(false);
        }
      });
    }
  }, [location.search]);

  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);

  useEffect(() => {
    studentService.getAll().then(students => setAllStudents(students.filter(s => s.status === 'active')));
  }, []);

  const loadData = useCallback(async () => {
    const allConvos = await messageService.getConversations(currentUserId, role);
    setConversations(allConvos);

    const params = new URLSearchParams(location.search);
    const studentIdParam = params.get('studentId');

    if (studentIdParam) {
      const targetConvo = allConvos.find(c => c.studentId === studentIdParam);
      if (targetConvo && targetConvo.id !== selectedConversation?.id) {
        setSelectedConversation(targetConvo);
        const msgs = await messageService.getMessages(targetConvo.id);
        setMessages(msgs);
        await messageService.markAsRead(targetConvo.id);
        setShowGroupInfo(false);
        return;
      }
    }

    if (selectedConversation) {
      const updatedConvo = allConvos.find(c => c.id === selectedConversation.id);
      if (updatedConvo) {
        setSelectedConversation(updatedConvo);
      }
      const msgs = await messageService.getMessages(selectedConversation.id);
      setMessages(msgs);
    }
  }, [currentUserId, role, selectedConversation?.id, location.search]);

  useEffect(() => {
    if (role === 'student') {
      messageService.getConversations(currentUserId, role).then(convos => {
        if (convos.length === 0) {
          supabase
            .from('program_enrollments')
            .select('program:program_id(mentor_id)')
            .eq('student_id', currentUserId)
            .maybeSingle()
            .then(({ data: enrollment }) => {
              const mentorId = (enrollment as any)?.program?.mentor_id;
              if (mentorId) {
                messageService.createConversation(currentUserId, 'Mentor', mentorId);
              }
            });
        }
      });
    }
  }, [role, currentUserId]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscriptions replace polling
  useRealtime([
    {
      table: 'messages',
      event: 'INSERT',
      callback: (payload: any) => {
        const row = payload.new as any;
        const convoId = row.conversation_id;
        if (convoId === selectedConversation?.id) {
          const newMsg: Message = {
            id: row.id,
            senderId: row.sender_id,
            conversationId: row.conversation_id,
            content: row.content,
            type: row.type,
            status: row.status,
            timestamp: row.created_at,
            audioUrl: row.audio_url,
            duration: row.duration,
          };
          setMessages(prev => [...prev, newMsg]);
        }
        loadData();
      },
    },
    {
      table: 'messages',
      event: 'UPDATE',
      callback: () => {
        if (selectedConversation) {
          messageService.getMessages(selectedConversation.id).then(setMessages);
        }
      },
    },
  ]);

  const prevConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedConversation) return;

    const isSameConversation = prevConversationIdRef.current === selectedConversation.id;
    prevConversationIdRef.current = selectedConversation.id;

    const scrollBehavior = isSameConversation ? 'smooth' : 'auto';

    const timer = setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: scrollBehavior,
        });
      } else {
        messagesEndRef.current?.scrollIntoView({
          behavior: scrollBehavior,
          block: 'end',
        });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [messages, selectedConversation?.id]);

  const handleSelectConversation = async (c: Conversation) => {
    setSelectedConversation(c);
    const msgs = await messageService.getMessages(c.id);
    setMessages(msgs);
    await messageService.markAsRead(c.id);
    setShowGroupInfo(false);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !selectedConversation) return;
    await messageService.sendMessage({
      senderId: currentUserId,
      senderName: currentUserName || (role === 'mentor' ? 'Mentor' : 'Student'),
      conversationId: selectedConversation.id,
      content: content.trim(),
      type: 'text'
    });
    await loadData();
  };

  const handleSendVoiceMessage = async (audioUrl: string, duration: number) => {
    if (!selectedConversation) return;
    await messageService.sendMessage({
      senderId: currentUserId,
      senderName: currentUserName || (role === 'mentor' ? 'Mentor' : 'Student'),
      conversationId: selectedConversation.id,
      content: audioUrl,
      type: 'voice',
      audioUrl,
      duration
    });
    await loadData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;
    await messageService.sendMessage({
      senderId: currentUserId,
      senderName: currentUserName || (role === 'mentor' ? 'Mentor' : 'Student'),
      conversationId: selectedConversation.id,
      content: `Attached File: ${file.name}`,
      type: 'file'
    });
    await loadData();
  };

  const handleAddParticipant = async (studentId: string) => {
    if (!selectedConversation || !selectedConversation.isGroup) return;
    const currentParticipants = selectedConversation.participants || [];
    if (currentParticipants.includes(studentId)) return;

    const updated = [...currentParticipants, studentId];
    await messageService.updateGroupParticipants(selectedConversation.id, updated);

    const studentInfo = allStudents.find(s => s.id === studentId || s.user_id === studentId);
    await messageService.sendMessage({
      conversationId: selectedConversation.id,
      senderId: currentUserId,
      senderName: 'System',
      content: `${studentInfo?.name || 'A student'} was added to the group.`,
      type: 'system'
    });

    await loadData();
  };

  const handleRemoveParticipant = async (studentId: string) => {
    if (!selectedConversation || !selectedConversation.isGroup) return;
    const currentParticipants = selectedConversation.participants || [];
    const updated = currentParticipants.filter(id => id !== studentId);
    await messageService.updateGroupParticipants(selectedConversation.id, updated);

    const studentInfo = allStudents.find(s => s.id === studentId || s.user_id === studentId);
    await messageService.sendMessage({
      conversationId: selectedConversation.id,
      senderId: currentUserId,
      senderName: 'System',
      content: `${studentInfo?.name || 'A student'} was removed from the group.`,
      type: 'system'
    });

    await loadData();
  };

  const handleHeaderClick = () => {
    setShowGroupInfo(prev => !prev);
  };

  const handlePinConversation = async (id: string, pinned: boolean) => {
    await messageService.pinConversation(id, pinned);
    await loadData();
  };

  const handleArchiveConversation = async (id: string, archived: boolean) => {
    await messageService.archiveConversation(id, archived);
    await loadData();
  };

  const handleCreateConversation = (c: Conversation) => {
    handleSelectConversation(c);
  };

  return (
    <div className="bg-[#f0f2f5] h-full w-full mx-auto md:rounded-none overflow-hidden flex shadow-none border-0">
      <ConversationList
        conversations={conversations}
        selectedConversationId={selectedConversation?.id}
        mutedConversations={mutedConversations}
        allStudents={allStudents}
        role={role}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onSelectConversation={handleSelectConversation}
        onPinConversation={handlePinConversation}
        onArchiveConversation={handleArchiveConversation}
        onCreateConversation={handleCreateConversation}
      />

      <div className={`flex-1 flex bg-[#efeae2] relative ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center flex-col text-center px-8">
            <div className="w-[320px] h-[200px] mb-8 bg-[#dadada] rounded-2xl flex items-center justify-center opacity-50">
              <MessageSquare size={80} className="text-[#41525d]" />
            </div>
            <h2 className="text-3xl font-light text-[#41525d] mb-4">MESSAGING FOR MENTORINO</h2>
            <p className="text-[#667781] text-sm leading-relaxed max-w-md">
              Send and receive messages without keeping your phone online.<br/>
              Use Mentorino Messaging on up to 4 linked devices and 1 phone at the same time.
            </p>
            <div className="absolute bottom-10 flex items-center gap-2 text-[#8696a0] text-sm">
              <span className="w-3 h-3 border border-current rounded-sm"></span> End-to-end encrypted
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
              <ConversationHeader
                selectedConversation={selectedConversation}
                role={role}
                onBack={() => setSelectedConversation(null)}
                onHeaderClick={handleHeaderClick}
              />

              <MessageThread
                messages={messages}
                currentUserId={currentUserId}
                isGroup={selectedConversation.isGroup}
                chatContainerRef={chatContainerRef}
                messagesEndRef={messagesEndRef}
              />

              <ComposeBar
                onSendMessage={handleSendMessage}
                onSendVoiceMessage={handleSendVoiceMessage}
                onFileUpload={handleFileUpload}
              />
            </div>

            <ContactInfoPanel
              show={showGroupInfo}
              selectedConversation={selectedConversation}
              role={role}
              currentUserId={currentUserId}
              allStudents={allStudents}
              avatarPreviews={avatarPreviews}
              onClose={() => setShowGroupInfo(false)}
              onAddParticipant={handleAddParticipant}
              onRemoveParticipant={handleRemoveParticipant}
              onShowToast={(message, type) => setToast({ message, type })}
            />
          </>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 z-[100] text-xs font-semibold border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-indigo-400'}`} />
          <span>{toast.message}</span>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0,0,0,0.2);
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default WhatsAppMessaging;
