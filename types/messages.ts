// types/messages.ts
export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
};

export type ConversationSummary = {
  user_id: string;
  username: string;
  photo_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
};
