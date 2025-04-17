export type ConnectionRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_name: string;
  status: 'pending' | 'accepted';
  created_at: string;
};

export type Connection = {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
};
