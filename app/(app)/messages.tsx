// app/(app)/messages.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth';
import { getConversations } from '../../services/messages';
import { Ionicons } from '@expo/vector-icons';
import { ConversationSummary } from '../../types/messages';
import { router } from 'expo-router';

export default function MessagesScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load conversations - wrapped in useCallback to avoid recreating on every render
  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { conversations: userConversations, error } =
        await getConversations(user.id);

      if (error) {
        console.error('Error loading conversations:', error);
      } else {
        setConversations(userConversations);
      }
    } catch (error) {
      console.error('Error in loadConversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Load conversations on component mount - only once
  useEffect(() => {
    loadConversations();

    // We removed the polling here to prevent constant re-renders
    // Users can manually refresh or navigate to/from screen to get updates
  }, [loadConversations]);

  // Handle manual refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  // Navigate to specific chat
  const navigateToChat = (userId: string, username: string) => {
    router.push({
      pathname: '/(app)/chat/[userId]',
      params: { userId, username },
    });
  };

  // Format timestamp
  const formatMessageTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      // Today, show time
      return messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffInDays < 7) {
      // Days of the week
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      // More than a week ago, show date
      return messageDate.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#5E72E4" />
        <Text className="mt-4 text-gray-600">Loading messages...</Text>
      </SafeAreaView>
    );
  }

  // Render conversation item
  const renderConversationItem = (conversation: ConversationSummary) => (
    <TouchableOpacity
      key={conversation.user_id}
      className={`flex-row items-center p-4 border-b border-gray-100 ${
        conversation.unread_count > 0 ? 'bg-blue-50' : ''
      }`}
      onPress={() =>
        navigateToChat(conversation.user_id, conversation.username)
      }
    >
      {conversation.photo_url ? (
        <Image
          source={{ uri: conversation.photo_url }}
          className="w-14 h-14 rounded-full"
        />
      ) : (
        <View className="w-14 h-14 rounded-full bg-gray-300 items-center justify-center">
          <Text className="text-gray-600 text-xl font-bold">
            {conversation.username?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
      )}

      <View className="ml-4 flex-1">
        <View className="flex-row justify-between items-center">
          <Text className="text-lg font-semibold text-gray-800">
            {conversation.username}
          </Text>
          <Text className="text-xs text-gray-500">
            {formatMessageTime(conversation.last_message_time)}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mt-1">
          <Text
            className={`text-sm flex-1 mr-2 ${
              conversation.unread_count > 0
                ? 'text-gray-800 font-medium'
                : 'text-gray-600'
            }`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {conversation.last_message}
          </Text>

          {conversation.unread_count > 0 && (
            <View className="bg-primary rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-xs font-bold">
                {conversation.unread_count > 9
                  ? '9+'
                  : conversation.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Ionicons name="chatbubble-ellipses-outline" size={64} color="#CBD5E1" />
      <Text className="text-gray-400 mt-4 text-center">
        You don't have any messages yet.
      </Text>
      <Text className="text-gray-400 text-center">
        Start a conversation with one of your connections.
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-6 pb-4">
        <Text className="text-3xl font-bold text-gray-800">Messages</Text>
        <Text className="text-base text-gray-600 mt-1">Your conversations</Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {conversations.length === 0
          ? renderEmptyState()
          : conversations.map(renderConversationItem)}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
