export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  conversationId: string;
  content: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
  type: "text" | "image" | "file" | "voice" | "system";
  audioUrl?: string;
  duration?: number;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
}

export interface Conversation {
  id: string;
  studentId?: string;
  studentName?: string;
  mentorId: string;
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
