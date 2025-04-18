// services/messages.ts
import { supabase } from '../lib/supabase';
import { Message, ConversationSummary } from '../types/messages';

/**
 * Send a message to another user
 * @param senderId - ID of the sender
 * @param receiverId - ID of the receiver
 * @param content - Content of the message
 */
export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string
) {
  try {
    // First, verify these users are connected
    const { data: connections, error: connectionError } = await supabase
      .from('connections')
      .select('*')
      .or(
        `and(user1_id.eq.${senderId},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${senderId})`
      );

    if (connectionError) {
      console.error('Error checking connection:', connectionError);
      return { error: connectionError };
    }

    if (!connections || connections.length === 0) {
      return { error: new Error('Users are not connected') };
    }

    // Send the message
    const { error } = await supabase.from('messages').insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      read: false,
    });

    return { error };
  } catch (error) {
    console.error('Error sending message:', error);
    return { error };
  }
}

/**
 * Get conversation between two users
 * @param userId - Current user ID
 * @param otherUserId - Other user ID
 */
export async function getConversation(userId: string, otherUserId: string) {
  try {
    // Verify these users are connected
    const { data: connections, error: connectionError } = await supabase
      .from('connections')
      .select('*')
      .or(
        `and(user1_id.eq.${userId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${userId})`
      );

    if (connectionError) {
      console.error('Error checking connection:', connectionError);
      return { messages: [], error: connectionError };
    }

    if (!connections || connections.length === 0) {
      return { messages: [], error: new Error('Users are not connected') };
    }

    // Get all messages between these users
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting conversation:', error);
      return { messages: [], error };
    }

    // Mark messages as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', userId)
      .eq('read', false);

    return { messages: data as Message[], error: null };
  } catch (error) {
    console.error('Error in getConversation:', error);
    return { messages: [], error };
  }
}

/**
 * Get all conversations for a user
 * @param userId - Current user ID
 */
export async function getConversations(userId: string) {
  try {
    // Query to get the most recent message from each conversation
    const { data, error } = await supabase.rpc('get_user_conversations', {
      user_id_param: userId,
    });

    if (error) {
      console.error('Error getting conversations:', error);
      return { conversations: [], error };
    }

    return { conversations: data as ConversationSummary[], error: null };
  } catch (error) {
    console.error('Error in getConversations:', error);
    return { conversations: [], error };
  }
}

/**
 * Mark all messages from a user as read
 * @param userId - Current user ID
 * @param senderId - Sender's user ID
 */
export async function markMessagesAsRead(userId: string, senderId: string) {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', userId)
      .eq('read', false);

    return { error };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { error };
  }
}

/**
 * Get unread message count for a user
 * @param userId - Current user ID
 */
export async function getUnreadMessageCount(userId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('receiver_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error getting unread message count:', error);
      return { count: 0, error };
    }

    return { count: data.length, error: null };
  } catch (error) {
    console.error('Error in getUnreadMessageCount:', error);
    return { count: 0, error };
  }
}
