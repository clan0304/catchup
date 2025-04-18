// app/(app)/chat/[userId].tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/auth';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getConversation, sendMessage } from '../../../services/messages';
import { Message } from '../../../types/messages';
import { getProfile } from '../../../services/profile';
import { ProfileData } from '../../../types/auth';

export default function ChatScreen() {
  const { user } = useAuth();
  const { userId, username } = useLocalSearchParams<{
    userId: string;
    username: string;
  }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<ProfileData | null>(
    null
  );
  const scrollViewRef = useRef<ScrollView>(null);

  // Load conversation
  const loadConversation = useCallback(async () => {
    if (!user || !userId) return;

    try {
      // Only set loading to true on initial load, not during refreshes
      if (messages.length === 0) {
        setLoading(true);
      }

      const { messages: conversationMessages, error } = await getConversation(
        user.id,
        userId
      );

      if (error) {
        console.error('Error loading conversation:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error connecting with this user';

        if (errorMessage === 'Users are not connected') {
          Alert.alert(
            'Not Connected',
            'You can only message users you are connected with.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        }
      } else {
        // Compare messages to see if we actually need to update
        if (JSON.stringify(messages) !== JSON.stringify(conversationMessages)) {
          setMessages(conversationMessages);
        }
      }

      // Load other user's profile if not loaded yet
      if (!otherUserProfile) {
        const { profile } = await getProfile(userId);
        if (profile) {
          setOtherUserProfile(profile);
        }
      }
    } catch (error) {
      console.error('Error in loadConversation:', error);
    } finally {
      setLoading(false);
    }
  }, [user, userId, messages, otherUserProfile]);

  // Load messages on mount and set up polling
  useEffect(() => {
    // Initial load
    loadConversation();

    // Set up polling to refresh messages - but at a lower frequency
    const intervalId = setInterval(() => {
      if (!sending) {
        loadConversation();
      }
    }, 30000); // Poll every 30 seconds instead of 10 seconds

    return () => clearInterval(intervalId);
  }, [user, userId, sending, loadConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!user || !userId || !messageText.trim()) return;

    try {
      setSending(true);
      const { error } = await sendMessage(user.id, userId, messageText.trim());

      if (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
      } else {
        // Add the message to the local state immediately
        const newMessage: Message = {
          id: `temp-${Date.now()}`,
          sender_id: user.id,
          receiver_id: userId,
          content: messageText.trim(),
          created_at: new Date().toISOString(),
          read: false,
        };
        setMessages((prev) => [...prev, newMessage]);
        setMessageText('');
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
    } finally {
      setSending(false);
    }
  };

  // Format timestamp
  const formatMessageTime = (timestamp: string) => {
    const messageTime = new Date(timestamp);
    return messageTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render message bubble
  const renderMessage = (message: Message, index: number) => {
    const isSentByMe = message.sender_id === user?.id;
    const showAvatar =
      index === 0 || messages[index - 1].sender_id !== message.sender_id;

    return (
      <View
        key={message.id}
        className={`flex-row ${
          isSentByMe ? 'justify-end' : 'justify-start'
        } mb-3`}
      >
        {!isSentByMe && showAvatar ? (
          otherUserProfile?.photo_url ? (
            <Image
              source={{ uri: otherUserProfile.photo_url }}
              className="w-8 h-8 rounded-full mr-2"
            />
          ) : (
            <View className="w-8 h-8 rounded-full bg-gray-300 items-center justify-center mr-2">
              <Text className="text-gray-600 text-xs font-bold">
                {username?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )
        ) : !isSentByMe ? (
          <View className="w-8 mr-2" />
        ) : null}

        <View
          className={`px-4 py-2 rounded-2xl max-w-[80%] ${
            isSentByMe
              ? 'bg-primary rounded-tr-none'
              : 'bg-gray-200 rounded-tl-none'
          }`}
        >
          <Text className={isSentByMe ? 'text-black' : 'text-gray-800'}>
            {message.content}
          </Text>
          <Text
            className={`text-xs mt-1 ${
              isSentByMe ? 'text-blue-100' : 'text-gray-500'
            }`}
          >
            {formatMessageTime(message.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: username || 'Chat',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-2">
              <Ionicons name="arrow-back" size={24} color="#5E72E4" />
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 85}
        >
          {loading && messages.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#5E72E4" />
              <Text className="mt-4 text-gray-600">Loading messages...</Text>
            </View>
          ) : (
            <>
              <ScrollView
                ref={scrollViewRef}
                className="flex-1 px-4 pt-4"
                contentContainerStyle={{ flexGrow: 1 }}
              >
                {messages.length === 0 ? (
                  <View className="flex-1 items-center justify-center">
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={64}
                      color="#CBD5E1"
                    />
                    <Text className="text-gray-400 mt-4 text-center">
                      No messages yet.
                    </Text>
                    <Text className="text-gray-400 text-center">
                      Say hello to start the conversation!
                    </Text>
                  </View>
                ) : (
                  messages.map(renderMessage)
                )}
              </ScrollView>

              <View className="flex-row items-center border-t border-gray-200 p-2">
                <TextInput
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
                  placeholder="Type a message..."
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  className={`rounded-full p-2 ${
                    messageText.trim() ? 'bg-primary' : 'bg-gray-300'
                  }`}
                  onPress={handleSendMessage}
                  disabled={!messageText.trim() || sending}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="send" size={20} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
