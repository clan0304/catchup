// services/connections.ts
import { supabase } from '../lib/supabase';
import { ConnectionRequest, Connection } from '../types/connections';

// Define the UserConnection type to match what's expected in the connections screen
export type UserConnection = {
  connectionId: string;
  userId: string;
  username: string;
  photoUrl: string | null;
  city: string;
  interests: string[];
  createdAt: string;
};

/**
 * Send a connection request to another user
 */
export async function sendConnectionRequest(
  senderId: string,
  receiverId: string
) {
  try {
    // Get sender's username
    const { data: senderData } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', senderId)
      .single();

    if (!senderData?.username) {
      return { error: new Error('Sender profile not found') };
    }

    // Check if a request already exists
    const { data: existingRequests } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .eq('status', 'pending');

    if (existingRequests && existingRequests.length > 0) {
      return { error: new Error('Connection request already sent') };
    }

    // Check if they're already connected
    const { data: existingConnections } = await supabase
      .from('connections')
      .select('*')
      .or(`user1_id.eq.${senderId},user2_id.eq.${senderId}`)
      .or(`user1_id.eq.${receiverId},user2_id.eq.${receiverId}`);

    if (existingConnections && existingConnections.length > 0) {
      return { error: new Error('Users are already connected') };
    }

    // Create the connection request
    const { error } = await supabase.from('connection_requests').insert({
      sender_id: senderId,
      receiver_id: receiverId,
      sender_name: senderData.username,
      status: 'pending',
    });

    return { error };
  } catch (error) {
    console.error('Error sending connection request:', error);
    return { error };
  }
}

/**
 * Get all pending connection requests for a user
 */
export async function getConnectionRequests(userId: string) {
  try {
    const { data, error } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return { requests: data as ConnectionRequest[] };
  } catch (error) {
    console.error('Error getting connection requests:', error);
    return { requests: [] };
  }
}

/**
 * Accept a connection request
 */
export async function acceptConnectionRequest(requestId: string) {
  try {
    // Start a transaction
    const { data: request, error: fetchError } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      return { error: fetchError || new Error('Request not found') };
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('connection_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) {
      return { error: updateError };
    }

    // Create connection
    const { error: connectionError } = await supabase
      .from('connections')
      .insert({
        user1_id: request.sender_id,
        user2_id: request.receiver_id,
      });

    return { error: connectionError };
  } catch (error) {
    console.error('Error accepting connection request:', error);
    return { error };
  }
}

/**
 * Get all connections for a user with detailed profile information
 */
export async function getUserConnections(
  userId: string
): Promise<{ connections: UserConnection[]; error: any }> {
  try {
    // First, get all connections for this user
    const { data: connectionsData, error: connectionsError } = await supabase
      .from('connections')
      .select('id, created_at, user1_id, user2_id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (connectionsError) {
      console.error('Error fetching connections:', connectionsError);
      return { connections: [], error: connectionsError };
    }

    // If no connections, return empty array
    if (!connectionsData || connectionsData.length === 0) {
      return { connections: [], error: null };
    }

    // For each connection, find the other user's profile
    const connections: UserConnection[] = [];

    // Process each connection one by one
    for (const connection of connectionsData) {
      // Determine the other user's ID
      const otherUserId =
        connection.user1_id === userId
          ? connection.user2_id
          : connection.user1_id;

      // Fetch the other user's profile details
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, photo_url, city, interests')
        .eq('id', otherUserId)
        .single();

      if (profileError) {
        console.error(
          `Error fetching profile for user ${otherUserId}:`,
          profileError
        );
        continue; // Skip this connection and move to the next
      }

      // Add to the connections list
      connections.push({
        connectionId: connection.id,
        userId: profileData.id,
        username: profileData.username,
        photoUrl: profileData.photo_url,
        city: profileData.city,
        interests: profileData.interests || [],
        createdAt: connection.created_at,
      });
    }

    return { connections, error: null };
  } catch (error) {
    console.error('Error in getUserConnections:', error);
    return { connections: [], error };
  }
}

/**
 * Disconnect from a user by removing the connection
 */
export async function disconnectUser(connectionId: string) {
  try {
    // Delete the connection
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      console.error('Error disconnecting user:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in disconnectUser:', error);
    return { error };
  }
}
