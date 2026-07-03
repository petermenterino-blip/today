import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { messageService } from '../../services/messageService';
import { storageService } from '../../services/storageService';
import { studentService } from '../../services/studentService';
import { useRealtime } from '../../hooks/useRealtime';
import { Message, Conversation } from '../../types/messaging';
import { StudentProfile, Application } from '../../types';
import { ConversationList } from './ConversationList';
import { ConversationHeader } from './ConversationHeader';
import { MessageThread } from './MessageThread';
import { ComposeBar } from './ComposeBar';
import { ContactInfoPanel } from './ContactInfoPanel';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'image/png',
  'image/jpeg',
  'application/zip',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'video/mp4',
  'video/webm',
  'video/ogg',
];

interface WhatsAppMessagingProps {
  role: 'student' | 'mentor';
  currentUserId: string;
  currentUserName?: string;
}

function sortConversations(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const aTime = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
    const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
    return bTime - aTime;
  });
}

const WhatsAppMessaging: React.FC<WhatsAppMessagingProps> = ({ role, currentUserId, currentUserName }) => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [mutedConversations] = useState<string[]>([]);
  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () => messageService.getMessages(selectedConversation!.id),
    enabled: !!selectedConversation,
    staleTime: 1000 * 60, // 1 minute
  });

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

  const navigateToStudent = useCallback(async (studentId: string) => {
    const allConvos = await messageService.getConversations(currentUserId, role);
    setConversations(allConvos);
    const targetConvo = allConvos.find(c => c.studentId === studentId);
    if (targetConvo && targetConvo.id !== selectedConversation?.id) {
      setSelectedConversation(targetConvo);
      await messageService.markAsRead(targetConvo.id);
      setShowGroupInfo(false);
    }
  }, [currentUserId, role, selectedConversation?.id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const studentIdParam = params.get('studentId');
    if (studentIdParam) {
      navigateToStudent(studentIdParam);
    }
  }, [location.search, navigateToStudent]);

  useEffect(() => {
    const loadContacts = async () => {
      const [students, apps] = await Promise.all([
        studentService.getAll(),
        supabase.from('applications').select('user_id').in('status', ['approved', 'invited']),
      ]);
      const rawStudents: any[] = students;
      const approvedUserIds = new Set((apps.data || []).map((a: any) => a.user_id));
      const combined: StudentProfile[] = rawStudents
        .filter((s: any) => approvedUserIds.has(s.id) || approvedUserIds.has(s.user_id))
        .map((s: any) => ({
          user_id: s.id, id: s.id, name: s.name || '', email: s.email || '',
          status: s.status || 'active', linkedin_url: '', resume_link: '', bio: '', specialization: '', current_status: '', tags: s.tags || [],
        }));
      const existingIds = new Set(combined.map(s => s.id));
      for (const a of (apps.data || [])) {
        if (!existingIds.has(a.user_id)) {
          combined.push({ user_id: a.user_id, id: a.user_id, name: '', email: '', status: 'active' as const, linkedin_url: '', resume_link: '', bio: '', specialization: '', current_status: '' });
        }
      }
      setAllStudents(combined);
    };
    loadContacts();
  }, []);

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
                messageService.createConversation(currentUserId, currentUserName || 'Student', mentorId).then(() => {
                  messageService.getConversations(currentUserId, role).then(setConversations);
                });
              }
            });
        }
      });
    }
  }, [role, currentUserId, currentUserName]);

  const loadConversations = useCallback(() => {
      messageService.getConversations(currentUserId, role).then(setConversations);
  }, [currentUserId, role]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useRealtime([
    {
      table: 'messages',
      event: 'INSERT',
      callback: (payload: any) => {
        const row = payload.new as any;
        if (row.sender_id === currentUserId) return;

        queryClient.invalidateQueries({ queryKey: ['messages', row.conversation_id] });

        setConversations(prev => {
          const updated = prev.map(c => {
            if (c.id !== row.conversation_id) return c;
            const lastMsg = row.type === 'voice' ? 'Voice message'
              : row.type === 'file' ? (row.file_name || 'File attachment')
              : row.content;
            return {
              ...c,
              lastMessage: lastMsg,
              lastMessageTime: row.created_at,
              unreadCount: row.conversation_id === selectedConversation?.id ? 0 : (c.unreadCount || 0) + 1,
            };
          });
          return sortConversations(updated);
        });
      },
    },
    {
      table: 'messages',
      event: 'UPDATE',
      callback: (payload: any) => {
        queryClient.invalidateQueries({ queryKey: ['messages', payload.new.conversation_id] });
      },
    },
  ]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'message_sync_ts') {
        loadConversations();
        queryClient.invalidateQueries({ queryKey: ['messages'] });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [loadConversations, queryClient]);

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
    await messageService.markAsRead(c.id);
    setConversations(prev => prev.map(x => x.id === c.id ? { ...x, unreadCount: 0 } : x));
    setShowGroupInfo(false);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !selectedConversation) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      senderId: currentUserId,
      senderName: currentUserName || (role === 'mentor' ? 'Mentor' : 'Student'),
      conversationId: selectedConversation.id,
      content: content.trim(),
      type: 'text',
      status: 'sent',
      timestamp: new Date().toISOString(),
    };

    queryClient.setQueryData<Message[]>(['messages', selectedConversation.id], (old = []) => [...old, optimisticMessage]);

    try {
      await messageService.sendMessage({
        senderId: currentUserId,
        senderName: currentUserName || (role === 'mentor' ? 'Mentor' : 'Student'),
        conversationId: selectedConversation.id,
        content: content.trim(),
        type: 'text',
      });
    } finally {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation.id] });
      loadConversations();
    }
  };

  const handleSendVoiceMessage = async (audioUrl: string, duration: number) => {
    if (!selectedConversation) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      senderId: currentUserId,
      senderName: currentUserName || (role === 'mentor' ? 'Mentor' : 'Student'),
      conversationId: selectedConversation.id,
      content: audioUrl,
      type: 'voice',
      status: 'sent',
      audioUrl,
      duration,
      timestamp: new Date().toISOString(),
    };

    queryClient.setQueryData<Message[]>(['messages', selectedConversation.id], (old = []) => [...old, optimisticMessage]);

    try {
      await messageService.sendMessage({
        senderId: currentUserId,
        senderName: currentUserName || (role === 'mentor' ? 'Mentor' : 'Student'),
        conversationId: selectedConversation.id,
        content: audioUrl,
        type: 'voice',
        audioUrl,
        duration,
      });
    } finally {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation.id] });
      loadConversations();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    if (file.size > MAX_FILE_SIZE) {
      setToast({ message: 'File too large. Max 25MB.', type: 'error' });
      return;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setToast({ message: 'Unsupported file type. Allowed: PDF, DOCX, DOC, TXT, PNG, JPG, ZIP, PPT, PPTX, XLS, XLSX, audio, video.', type: 'error' });
      return;
    }

    try {
      setToast({ message: 'Uploading file...', type: 'info' });

      const tempId = `temp_${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        senderId: currentUserId,
        senderName: currentUserName || (role === 'mentor' ? 'Mentor' : 'Student'),
        conversationId: selectedConversation.id,
        content: file.name,
        type: 'file',
        status: 'sent',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        timestamp: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(['messages', selectedConversation.id], (old = []) => [...old, optimisticMessage]);

      const fileUrl = await storageService.uploadMessageAttachment(currentUserId, file);

      await messageService.sendMessage({
        senderId: currentUserId,
        senderName: currentUserName || (role === 'mentor' ? 'Mentor' : 'Student'),
        conversationId: selectedConversation.id,
        content: file.name,
        type: 'file',
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        fileType: file.type,
      });

      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation.id] });
      loadConversations();
      setToast({ message: 'File sent!', type: 'success' });
    } catch {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation.id] });
      setToast({ message: 'File upload failed.', type: 'error' });
    }
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
      type: 'system',
    });

    queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation.id] });
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
      type: 'system',
    });

    queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation.id] });
  };

  const handleHeaderClick = () => {
    setShowGroupInfo(prev => !prev);
  };

  const handlePinConversation = async (id: string, pinned: boolean) => {
    setConversations(prev => sortConversations(prev.map(c =>
      c.id === id ? { ...c, pinned } : c
    )));
    await messageService.pinConversation(id, pinned);
    loadConversations();
  };

  const handleArchiveConversation = async (id: string, archived: boolean) => {
    setConversations(prev => sortConversations(prev.map(c =>
      c.id === id ? { ...c, archived } : c
    )));
    await messageService.archiveConversation(id, archived);
    loadConversations();
  };

  const handleCreateConversation = (c: Conversation) => {
    handleSelectConversation(c);
    setConversations(prev => {
      if (prev.some(x => x.id === c.id)) return prev;
      return sortConversations([...prev, c]);
    });
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
