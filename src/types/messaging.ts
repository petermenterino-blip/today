export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  conversationId: string;
  content: string;
  timestamp: string;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
  type: "text" | "image" | "file" | "voice" | "system";
  audioUrl?: string;
  duration?: number;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  edited?: boolean;
  deleted?: boolean;
  retryCount?: number;
}

export interface Conversation {
  id: string;
  studentId?: string;
  studentName?: string;
  mentorId: string;
  mentorName?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  pinned: boolean;
  archived?: boolean;
  isGroup?: boolean;
  name?: string;
  participants?: string[];
  adminId?: string;
  description?: string;
}
