import { supabase } from '../lib/supabase';
import type { Message, Conversation } from '../types/messaging';

function fromDbConversation(row: any): Conversation {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    mentorId: row.mentor_id,
    mentorName: row.mentor_name || undefined,
    lastMessage: row.last_message || '',
    lastMessageTime: row.last_message_time || row.created_at,
    unreadCount: row.unread_count || 0,
    pinned: row.pinned || false,
    archived: row.archived || false,
    isGroup: row.is_group || false,
    name: row.name,
    participants: row.participants || [],
    adminId: row.admin_id,
    description: row.description,
  };
}

async function fetchProfileName(userId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', userId)
      .single();
    return data?.name || 'Unknown User';
  } catch {
    return 'Unknown User';
  }
}

async function enrichConversation(c: Conversation): Promise<Conversation> {
  if (!c.isGroup) {
    if (!c.studentName) {
      c.studentName = await fetchProfileName(c.studentId || '');
    }
    if (!c.mentorName) {
      c.mentorName = await fetchProfileName(c.mentorId);
    }
  }
  return c;
}

function fromDbMessage(row: any): Message {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    conversationId: row.conversation_id,
    content: row.content,
    timestamp: row.created_at,
    status: row.status,
    type: row.type,
    audioUrl: row.audio_url,
    duration: row.duration,
    fileName: row.file_name,
    fileUrl: row.file_url,
    fileSize: row.file_size,
    fileType: row.file_type,
  };
}

function toDbMessage(data: Partial<Message>): Record<string, any> {
  const db: Record<string, any> = {};
  if (data.senderId !== undefined) db.sender_id = data.senderId;
  if (data.senderName !== undefined) db.sender_name = data.senderName;
  if (data.conversationId !== undefined) db.conversation_id = data.conversationId;
  if (data.content !== undefined) db.content = data.content;
  if (data.type !== undefined) db.type = data.type;
  if (data.audioUrl !== undefined) db.audio_url = data.audioUrl;
  if (data.duration !== undefined) db.duration = data.duration;
  if (data.fileName !== undefined) db.file_name = data.fileName;
  if (data.fileUrl !== undefined) db.file_url = data.fileUrl;
  if (data.fileSize !== undefined) db.file_size = data.fileSize;
  if (data.fileType !== undefined) db.file_type = data.fileType;
  return db;
}

export const messageService = {
  async getConversations(userId: string, _role: 'student' | 'mentor'): Promise<Conversation[]> {
    const { data: participants, error: partError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (partError) return [];
    const convIds = participants.map(p => p.conversation_id);
    if (convIds.length === 0) return [];

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .is('deleted_at', null)
      .order('pinned', { ascending: false })
      .order('last_message_time', { ascending: false });

    if (error) return [];
    const convs = (data || []).map(fromDbConversation);
    const enriched = await Promise.all(convs.map(enrichConversation));
    return enriched;
  },

  async getAllConversations(): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .is('deleted_at', null)
      .order('pinned', { ascending: false })
      .order('last_message_time', { ascending: false });

    if (error) return [];
    return (data || []).map(fromDbConversation);
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) return [];
    return (data || []).map(fromDbMessage);
  },

  async getAllMessages(): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) return [];
    return (data || []).map(fromDbMessage);
  },

  async sendMessage(msg: Omit<Message, 'id' | 'timestamp' | 'status'>): Promise<Message | null> {
    const dbData = toDbMessage(msg as Partial<Message>);
    dbData.status = 'sent';
    dbData.created_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('messages')
      .insert(dbData)
      .select()
      .single();

    if (error) return null;

    const lastMsgText = msg.type === 'voice' ? 'Voice message'
      : msg.type === 'file' ? (msg.fileName || 'File attachment')
      : msg.content;

    await supabase
      .from('conversations')
      .update({
        last_message: lastMsgText,
        last_message_time: new Date().toISOString(),
      })
      .eq('id', msg.conversationId);

    try { localStorage.setItem('message_sync_ts', Date.now().toString()) } catch {}

    return fromDbMessage(data);
  },

  async markAsDelivered(conversationId: string): Promise<void> {
    await supabase
      .from('messages')
      .update({ status: 'delivered' })
      .eq('conversation_id', conversationId)
      .eq('status', 'sent');
  },

  async markAsRead(conversationId: string): Promise<void> {
    await supabase
      .from('conversations')
      .update({ unread_count: 0 })
      .eq('id', conversationId);

    await supabase
      .from('messages')
      .update({ status: 'read' })
      .eq('conversation_id', conversationId)
      .neq('status', 'read');
  },

  async pinConversation(conversationId: string, pinned: boolean): Promise<void> {
    await supabase
      .from('conversations')
      .update({ pinned })
      .eq('id', conversationId);
  },

  async archiveConversation(conversationId: string, archived: boolean): Promise<void> {
    await supabase
      .from('conversations')
      .update({ archived })
      .eq('id', conversationId);
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await supabase
      .from('conversations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', conversationId);

    await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('conversation_id', conversationId);
  },

  async getOtherParticipantProfile(conversationId: string, currentUserId: string): Promise<{ id: string; name: string; role: string; avatar_url?: string; email?: string } | null> {
    try {
      const { data: conv, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      if (error || !conv) return null;
      const otherId = conv.mentor_id === currentUserId ? conv.student_id : conv.mentor_id;
      if (!otherId) return null;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, role, avatar_url, email')
        .eq('id', otherId)
        .single();
      if (!profile) return null;
      return {
        id: profile.id,
        name: profile.name || 'Unknown User',
        role: profile.role || 'student',
        avatar_url: profile.avatar_url,
        email: profile.email,
      };
    } catch {
      return null;
    }
  },

  async getConversationParticipantProfile(conversationId: string, participantId: string): Promise<{ id: string; name: string; role: string; avatar_url?: string; email?: string; bio?: string; phone?: string; specialization?: string; created_at?: string } | null> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', participantId)
        .single();
      if (!profile) return null;
      return {
        id: profile.id,
        name: profile.name || 'Unknown User',
        role: profile.role || 'student',
        avatar_url: profile.avatar_url,
        email: profile.email,
        bio: profile.bio,
        phone: profile.phone,
        specialization: profile.specialization,
        created_at: profile.created_at,
      };
    } catch {
      return null;
    }
  },

  async getProfileByUserId(userId: string): Promise<any> {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      return data || null;
    } catch {
      return null;
    }
  },

  async createConversation(studentId: string, studentName: string, mentorId: string): Promise<Conversation | null> {
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('student_id', studentId)
      .eq('mentor_id', mentorId)
      .is('deleted_at', null)
      .maybeSingle();

    if (existing) return fromDbConversation(existing);

    const [studentProfile, mentorProfile] = await Promise.all([
      fetchProfileName(studentId),
      fetchProfileName(mentorId),
    ]);

    const resolvedStudentName = studentName || studentProfile;
    if (resolvedStudentName === 'Unknown User' || mentorProfile === 'Unknown User') {
      return null;
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        student_id: studentId,
        student_name: resolvedStudentName,
        mentor_id: mentorId,
        mentor_name: mentorProfile === 'Unknown User' ? undefined : mentorProfile,
        last_message_time: new Date().toISOString(),
        participants: [studentId, mentorId],
      })
      .select()
      .single();

    if (error || !data) return null;

    await supabase.from('conversation_participants').insert([
      { conversation_id: data.id, user_id: studentId },
      { conversation_id: data.id, user_id: mentorId },
    ]);

    return fromDbConversation(data);
  },

  async createGroup(name: string, mentorId: string, participantIds: string[], description?: string): Promise<Conversation | null> {
    const allParticipants = [...new Set([mentorId, ...participantIds])];

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        mentor_id: mentorId,
        name,
        description: description || '',
        is_group: true,
        admin_id: mentorId,
        last_message: 'Community created',
        last_message_time: new Date().toISOString(),
        participants: allParticipants,
      })
      .select()
      .single();

    if (error || !data) return null;

    await supabase.from('conversation_participants').insert(
      allParticipants.map(user_id => ({
        conversation_id: data.id,
        user_id,
      }))
    );

    await supabase.from('messages').insert({
      conversation_id: data.id,
      sender_id: mentorId,
      sender_name: 'System',
      content: `${name} community has been created.`,
      type: 'system',
      status: 'sent',
      created_at: new Date().toISOString(),
    });

    return fromDbConversation(data);
  },

  async updateGroupParticipants(groupId: string, participantIds: string[]): Promise<void> {
    await supabase.from('conversation_participants').delete().eq('conversation_id', groupId);

    const allParticipants = [...new Set(participantIds)];

    await supabase.from('conversations').update({ participants: allParticipants }).eq('id', groupId);

    if (allParticipants.length > 0) {
      await supabase.from('conversation_participants').insert(
        allParticipants.map(user_id => ({
          conversation_id: groupId,
          user_id,
        }))
      );
    }
  },
};
