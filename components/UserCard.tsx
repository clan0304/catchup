// components/UserCard.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileData } from '../types/auth';

type UserCardProps = {
  profile: ProfileData;
  isConnected: boolean;
  isPendingRequest: boolean;
  isRequesting: boolean;
  onConnect: (userId: string) => void;
  onNavigateToChat: (userId: string, username: string) => void;
  requestingUserId: string | null;
};

const UserCard = ({
  profile,
  isConnected,
  isPendingRequest,
  isRequesting,
  onConnect,
  onNavigateToChat,
  requestingUserId,
}: UserCardProps) => {
  return (
    <TouchableOpacity
      key={profile.id}
      className="flex-row items-center bg-gray-50 rounded-xl p-4 mb-3 relative"
      activeOpacity={0.7}
    >
      {/* Message icon for connected users, shown at top right of profile container */}
      {isConnected && (
        <TouchableOpacity
          className="absolute top-2 right-2 bg-primary p-2 rounded-full z-10"
          onPress={() => onNavigateToChat(profile.id!, profile.username)}
        >
          <Ionicons name="chatbubble-outline" size={18} color="white" />
        </TouchableOpacity>
      )}

      {profile.photo_url ? (
        <Image
          source={{ uri: profile.photo_url }}
          className="w-16 h-16 rounded-full"
        />
      ) : (
        <View className="w-16 h-16 rounded-full bg-gray-300 items-center justify-center">
          <Text className="text-gray-600 text-xl font-bold">
            {profile.username?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
      )}

      <View className="ml-4 flex-1">
        <Text className="text-lg font-semibold text-gray-800">
          {profile.username}
        </Text>
        <Text className="text-gray-600">{profile.city}</Text>

        <View className="flex-row mt-2 flex-wrap">
          {profile.interests &&
            profile.interests.slice(0, 3).map((interest, index) => (
              <View
                key={index}
                className="bg-blue-100 px-2 py-1 rounded-full mr-2 mb-1"
              >
                <Text className="text-xs text-blue-800">{interest}</Text>
              </View>
            ))}

          {profile.interests && profile.interests.length > 3 && (
            <Text className="text-xs text-gray-500 ml-1 mt-1">
              +{profile.interests.length - 3} more
            </Text>
          )}
        </View>
      </View>

      <View className="flex-row">
        {/* Connect button - only shown if not connected and no pending request */}
        {!isConnected && !isPendingRequest && (
          <TouchableOpacity
            className="bg-primary py-2 px-3 rounded-lg"
            onPress={() => onConnect(profile.id!)}
            disabled={isRequesting}
          >
            {requestingUserId === profile.id ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-medium">Connect</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Pending button - shown if request is pending */}
        {!isConnected && isPendingRequest && (
          <TouchableOpacity
            className="bg-gray-300 py-2 px-3 rounded-lg"
            disabled={true}
          >
            <Text className="text-gray-600 font-medium">Pending</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default UserCard;
