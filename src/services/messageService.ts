import { supabase } from '../lib/supabase';
import type { Message, Conversation } from '../types/messaging';
import { logger } from '../lib/logger';

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
    } catch (err) {
      logger.error('messageService', 'fetchProfileName failed', { userId, error: err instanceof Error ? err.message : 'Unknown error' });
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

const CONVERSATION_FIELDS = 'id,student_id,student_name,mentor_id,mentor_name,last_message,last_message_time,created_at,unread_count,pinned,archived,is_group,name,participants,admin_id,description';
const MESSAGE_FIELDS = 'id,sender_id,sender_name,conversation_id,content,created_at,status,type,audio_url,duration,file_name,file_url,file_size,file_type';

export const messageService = {
  async getConversations(userId: string, _role: 'student' | 'mentor'): Promise<Conversation[]> {
    const { data: participants, error: partError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (partError) {
      logger.error('messageService', 'getConversations: failed to fetch participants', { userId, error: partError.message });
      return [];
    }
    const convIds = participants.map(p => p.conversation_id);
    if (convIds.length === 0) return [];

    const { data, error } = await supabase
      .from('conversations')
      .select(CONVERSATION_FIELDS)
      .in('id', convIds)
      .is('deleted_at', null)
      .order('pinned', { ascending: false })
      .order('last_message_time', { ascending: false });

    if (error) {
      logger.error('messageService', 'getConversations: query failed', { error: error.message });
      return [];
    }
    const convs = (data || []).map(fromDbConversation);
    const enriched = await Promise.all(convs.map(enrichConversation));
    return enriched;
  },

  async getAllConversations(): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select(CONVERSATION_FIELDS)
      .is('deleted_at', null)
      .order('pinned', { ascending: false })
      .order('last_message_time', { ascending: false });

    if (error) {
      logger.error('messageService', 'getAllConversations: query failed', { error: error.message });
      return [];
    }
    return (data || []).map(fromDbConversation);
  },

  async getMessages(conversationId: string, limit = 30, beforeCursor?: string): Promise<Message[]> {
    let query = supabase
      .from('messages')
      .select(MESSAGE_FIELDS)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (beforeCursor) {
      query = query.lt('created_at', beforeCursor);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('messageService', 'getMessages: query failed', { conversationId, error: error.message });
      return [];
    }
    const msgs = (data || []).map(fromDbMessage);
    return msgs.reverse();
  },

  async getAllMessages(): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(MESSAGE_FIELDS)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('messageService', 'getAllMessages: query failed', { error: error.message });
      return [];
    }
    return (data || []).map(fromDbMessage).reverse();
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

    if (error) {
      logger.error('messageService', 'sendMessage: insert failed', { conversationId: msg.conversationId, error: error.message });
      return null;
    }

    const lastMsgText = msg.type === 'voice' ? 'Voice message'
      : msg.type === 'file' ? (msg.fileName || 'File attachment')
      : msg.content;

    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        last_message: lastMsgText,
        last_message_time: new Date().toISOString(),
      })
      .eq('id', msg.conversationId);

    if (updateError) {
      logger.error('messageService', 'sendMessage: conversation update failed', { conversationId: msg.conversationId, error: updateError.message });
    }

    try { localStorage.setItem('message_sync_ts', Date.now().toString()) } catch (e) { console.error('[messageService] localStorage write failed:', e); }

    return fromDbMessage(data);
  },

  async markAsDelivered(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ status: 'delivered' })
      .eq('conversation_id', conversationId)
      .eq('status', 'sent');

    if (error) {
      logger.error('messageService', 'markAsDelivered failed', { conversationId, error: error.message });
    }
  },

  async markAsRead(conversationId: string): Promise<void> {
    const { error: convError } = await supabase
      .from('conversations')
      .update({ unread_count: 0 })
      .eq('id', conversationId);

    if (convError) {
      logger.error('messageService', 'markAsRead: conversation update failed', { conversationId, error: convError.message });
    }

    const { error: msgError } = await supabase
      .from('messages')
      .update({ status: 'read' })
      .eq('conversation_id', conversationId)
      .neq('status', 'read');

    if (msgError) {
      logger.error('messageService', 'markAsRead: message update failed', { conversationId, error: msgError.message });
    }
  },

  async pinConversation(conversationId: string, pinned: boolean): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ pinned })
      .eq('id', conversationId);

    if (error) {
      logger.error('messageService', 'pinConversation failed', { conversationId, pinned, error: error.message });
    }
  },

  async archiveConversation(conversationId: string, archived: boolean): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ archived })
      .eq('id', conversationId);

    if (error) {
      logger.error('messageService', 'archiveConversation failed', { conversationId, archived, error: error.message });
    }
  },

  async deleteConversation(conversationId: string): Promise<void> {
    const { error: convError } = await supabase
      .from('conversations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (convError) {
      logger.error('messageService', 'deleteConversation: conversation delete failed', { conversationId, error: convError.message });
    }

    const { error: msgError } = await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('conversation_id', conversationId);

    if (msgError) {
      logger.error('messageService', 'deleteConversation: messages delete failed', { conversationId, error: msgError.message });
    }
  },

  async getOtherParticipantProfile(conversationId: string, currentUserId: string): Promise<{ id: string; name: string; role: string; avatar_url?: string; email?: string } | null> {
    try {
      const { data: conv, error } = await supabase
        .from('conversations')
        .select('mentor_id, student_id')
        .eq('id', conversationId)
        .single();
      if (error || !conv) {
        logger.error('messageService', 'getOtherParticipantProfile: conversation fetch failed', { conversationId, error: error?.message });
        return null;
      }
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
    } catch (err) {
      logger.error('messageService', 'getOtherParticipantProfile: unexpected error', { conversationId, error: err instanceof Error ? err.message : 'Unknown error' });
      return null;
    }
  },

  async getConversationParticipantProfile(conversationId: string, participantId: string): Promise<{ id: string; name: string; role: string; avatar_url?: string; email?: string; bio?: string; phone?: string; specialization?: string; created_at?: string } | null> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, role, avatar_url, email, bio, phone, specialization, created_at')
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
    } catch (err) {
      logger.error('messageService', 'getConversationParticipantProfile failed', { conversationId, participantId, error: err instanceof Error ? err.message : 'Unknown error' });
      return null;
    }
  },

  async getProfileByUserId(userId: string): Promise<any> {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email, role, avatar_url')
        .eq('id', userId)
        .single();
      return data || null;
    } catch (err) {
      logger.error('messageService', 'getProfileByUserId failed', { userId, error: err instanceof Error ? err.message : 'Unknown error' });
      return null;
    }
  },

  async createConversation(studentId: string, studentName: string, mentorId: string): Promise<Conversation | null> {
    const { data: existing } = await supabase
      .from('conversations')
      .select(CONVERSATION_FIELDS)
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
      logger.warn('messageService', 'createConversation: could not resolve user profiles', { studentId, mentorId });
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

    if (error || !data) {
      logger.error('messageService', 'createConversation: insert failed', { studentId, mentorId, error: error?.message });
      return null;
    }

    const { error: partError } = await supabase.from('conversation_participants').insert([
      { conversation_id: data.id, user_id: studentId },
      { conversation_id: data.id, user_id: mentorId },
    ]);

    if (partError) {
      logger.error('messageService', 'createConversation: participants insert failed', { conversationId: data.id, error: partError.message });
    }

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

    if (error || !data) {
      logger.error('messageService', 'createGroup: insert failed', { name, error: error?.message });
      return null;
    }

    const { error: partError } = await supabase.from('conversation_participants').insert(
      allParticipants.map(user_id => ({
        conversation_id: data.id,
        user_id,
      }))
    );

    if (partError) {
      logger.error('messageService', 'createGroup: participants insert failed', { conversationId: data.id, error: partError.message });
    }

    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: data.id,
      sender_id: mentorId,
      sender_name: 'System',
      content: `${name} community has been created.`,
      type: 'system',
      status: 'sent',
      created_at: new Date().toISOString(),
    });

    if (msgError) {
      logger.error('messageService', 'createGroup: system message insert failed', { conversationId: data.id, error: msgError.message });
    }

    return fromDbConversation(data);
  },

  async updateGroupParticipants(groupId: string, participantIds: string[]): Promise<void> {
    const { error: deleteError } = await supabase.from('conversation_participants').delete().eq('conversation_id', groupId);
    if (deleteError) {
      logger.error('messageService', 'updateGroupParticipants: delete failed', { groupId, error: deleteError.message });
      return;
    }

    const allParticipants = [...new Set(participantIds)];

    const { error: updateError } = await supabase.from('conversations').update({ participants: allParticipants }).eq('id', groupId);
    if (updateError) {
      logger.error('messageService', 'updateGroupParticipants: conversation update failed', { groupId, error: updateError.message });
    }

    if (allParticipants.length > 0) {
      const { error: insertError } = await supabase.from('conversation_participants').insert(
        allParticipants.map(user_id => ({
          conversation_id: groupId,
          user_id,
        }))
      );
      if (insertError) {
        logger.error('messageService', 'updateGroupParticipants: participants insert failed', { groupId, error: insertError.message });
      }
    }
  },
};
