// app/(app)/index.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth';
import { getProfile, getAllProfiles } from '../../services/profile';
import { ProfileData } from '../../types/auth';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  getUserConnections,
  getConnectionRequests,
  sendConnectionRequest,
} from '../../services/connections';
import { UserConnection } from '../../services/connections';
import { getUnreadMessageCount } from '../../services/messages';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<ProfileData | null>(null);
  const [allProfiles, setAllProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [connectedUserIds, setConnectedUserIds] = useState<Set<string>>(
    new Set()
  );
  const [requestingUserId, setRequestingUserId] = useState<string | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingRequestUserIds, setPendingRequestUserIds] = useState<
    Set<string>
  >(new Set());
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);

  // Animation for menu
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch current user's profile
        if (user) {
          const { profile } = await getProfile(user.id);
          if (profile) {
            setUserProfile(profile);
          }

          // Fetch user's connections
          const { connections: userConnections } = await getUserConnections(
            user.id
          );
          setConnections(userConnections);

          // Create a set of connected user IDs for quick lookup
          const connectedIds = new Set<string>();
          userConnections.forEach((conn) => connectedIds.add(conn.userId));
          setConnectedUserIds(connectedIds);

          // Fetch unread message count
          const { count } = await getUnreadMessageCount(user.id);
          setUnreadMessageCount(count);

          // Fetch pending connection requests
          const { requests } = await getConnectionRequests(user.id);
          setPendingRequestsCount(requests.length);

          // Track pending requests for the "Connect" button state
          // We also need to identify users who already have a pending request from current user
          const { data: sentRequests } = await supabase
            .from('connection_requests')
            .select('receiver_id')
            .eq('sender_id', user.id)
            .eq('status', 'pending');

          if (sentRequests) {
            const pendingIds = new Set<string>();
            sentRequests.forEach((req) => pendingIds.add(req.receiver_id));
            setPendingRequestUserIds(pendingIds);
          }
        }

        // Fetch all profiles
        const { profiles, error } = await getAllProfiles();
        if (error) {
          console.error('Error fetching profiles:', error);
        } else {
          setAllProfiles(profiles);
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up a polling interval for real-time updates
    const intervalId = setInterval(() => {
      if (user) {
        // Check for new connection requests
        getConnectionRequests(user.id).then(({ requests }) => {
          setPendingRequestsCount(requests.length);
        });

        // Check for new messages
        getUnreadMessageCount(user.id).then(({ count }) => {
          setUnreadMessageCount(count);
        });
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(intervalId);
  }, [user]);

  const handleConnectRequest = async (receiverId: string) => {
    if (!user) return;

    setRequestingUserId(receiverId);

    try {
      const { error } = await sendConnectionRequest(user.id, receiverId);

      if (error) {
        console.error('Error sending connection request:', error);
        // Fix the TypeScript error by using a type assertion or checking if message exists
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to send connection request';
        Alert.alert('Error', errorMessage);
      } else {
        Alert.alert('Success', 'Connection request sent!');

        // Update pending request IDs
        setPendingRequestUserIds((prev) => new Set([...prev, receiverId]));
      }
    } catch (error) {
      console.error('Error in handleConnectRequest:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setRequestingUserId(null);
    }
  };

  // Navigate to chat with a user
  const navigateToChat = (userId: string, username: string) => {
    if (!connectedUserIds.has(userId)) {
      Alert.alert(
        'Not Connected',
        'You can only message users you are connected with.'
      );
      return;
    }

    router.push({
      pathname: '/(app)/chat/[userId]',
      params: { userId, username },
    });
  };

  // Navigate to messages screen
  const navigateToMessages = () => {
    router.push('/(app)/messages');
  };

  // Profile menu functions
  const toggleProfileMenu = () => {
    if (profileMenuVisible) {
      // Close menu with animation
      Animated.timing(menuAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setProfileMenuVisible(false));
    } else {
      // Open menu with animation
      setProfileMenuVisible(true);
      Animated.timing(menuAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const navigateToProfile = () => {
    toggleProfileMenu();
    router.push('/(app)/profile-update');
  };

  const handleSignOut = () => {
    toggleProfileMenu();
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: signOut,
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#5E72E4" />
        <Text className="mt-4 text-gray-600">Loading profiles...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Header with profile info */}
        <View className="px-6 pt-6 pb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-bold text-gray-800">Welcome</Text>
            <Text className="text-xl text-gray-800">
              {userProfile?.username || 'User'}
            </Text>
          </View>

          <View className="flex-row">
            {/* Notification icon with badge */}
            <TouchableOpacity
              className="mr-4 relative"
              onPress={() => router.push('/(app)/connections')}
            >
              <Ionicons
                name="notifications-outline"
                size={28}
                color="#5E72E4"
              />
              {pendingRequestsCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Messages button with badge */}
            <TouchableOpacity
              className="mr-4 relative"
              onPress={navigateToMessages}
            >
              <Ionicons name="mail-outline" size={28} color="#5E72E4" />
              {unreadMessageCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Profile photo */}
            <TouchableOpacity onPress={toggleProfileMenu} className="relative">
              {userProfile?.photo_url ? (
                <Image
                  source={{ uri: userProfile.photo_url }}
                  className="w-8 h-8 rounded-full border-2 border-primary"
                />
              ) : (
                <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center border-2 border-primary">
                  <Text className="text-gray-600 text-xl font-bold">
                    {userProfile?.username?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* All Users Section */}
        <View className="px-6 mt-4">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            All Users
          </Text>

          {allProfiles.length === 0 ? (
            <View className="bg-gray-100 rounded-xl p-5 items-center justify-center">
              <Text className="text-gray-500">No other users found</Text>
            </View>
          ) : (
            <View className="mb-6">
              {allProfiles
                .filter((profile) => profile.id !== user?.id) // Filter out current user
                .map((profile) => (
                  <TouchableOpacity
                    key={profile.id}
                    className="flex-row items-center bg-gray-50 rounded-xl p-4 mb-3 relative"
                    activeOpacity={0.7}
                  >
                    {/* Message icon for connected users, shown at top right of profile container */}
                    {connectedUserIds.has(profile.id!) && (
                      <TouchableOpacity
                        className="absolute top-2 right-2 bg-primary p-2 rounded-full z-10"
                        onPress={() =>
                          navigateToChat(profile.id!, profile.username)
                        }
                      >
                        <Ionicons
                          name="chatbubble-outline"
                          size={18}
                          color="white"
                        />
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
                          profile.interests
                            .slice(0, 3)
                            .map((interest, index) => (
                              <View
                                key={index}
                                className="bg-blue-100 px-2 py-1 rounded-full mr-2 mb-1"
                              >
                                <Text className="text-xs text-blue-800">
                                  {interest}
                                </Text>
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
                      {!connectedUserIds.has(profile.id!) &&
                        !pendingRequestUserIds.has(profile.id!) && (
                          <TouchableOpacity
                            className="bg-primary py-2 px-3 rounded-lg"
                            onPress={() => handleConnectRequest(profile.id!)}
                            disabled={requestingUserId === profile.id}
                          >
                            {requestingUserId === profile.id ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <Text className="text-white font-medium">
                                Connect
                              </Text>
                            )}
                          </TouchableOpacity>
                        )}

                      {/* Pending button - shown if request is pending */}
                      {!connectedUserIds.has(profile.id!) &&
                        pendingRequestUserIds.has(profile.id!) && (
                          <TouchableOpacity
                            className="bg-gray-300 py-2 px-3 rounded-lg"
                            disabled={true}
                          >
                            <Text className="text-gray-600 font-medium">
                              Pending
                            </Text>
                          </TouchableOpacity>
                        )}
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View className="h-6" />
      </ScrollView>

      {/* Profile Menu Modal */}
      <Modal
        visible={profileMenuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={toggleProfileMenu}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={toggleProfileMenu}
          className="bg-black bg-opacity-50"
        >
          <Animated.View
            style={{
              transform: [
                {
                  translateY: menuAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [screenHeight, 0],
                  }),
                },
              ],
            }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
          >
            <View className="py-2 px-5">
              {/* Handle indicator */}
              <View className="w-16 h-1 bg-gray-300 rounded-full mx-auto mb-4 mt-2" />

              {/* User info */}
              <View className="flex-row items-center mb-6 mt-2">
                {userProfile?.photo_url ? (
                  <Image
                    source={{ uri: userProfile.photo_url }}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <View className="w-16 h-16 rounded-full bg-gray-300 items-center justify-center">
                    <Text className="text-gray-600 text-2xl font-bold">
                      {userProfile?.username?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <View className="ml-4">
                  <Text className="text-xl font-bold">
                    {userProfile?.username || 'User'}
                  </Text>
                  <Text className="text-gray-500">
                    {userProfile?.city || ''}
                  </Text>
                </View>
              </View>

              {/* Menu options */}
              <TouchableOpacity
                className="flex-row items-center py-4 border-t border-gray-200"
                onPress={navigateToProfile}
              >
                <Ionicons name="person-outline" size={24} color="#5E72E4" />
                <Text className="ml-4 text-lg">Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center py-4 border-t border-gray-200"
                onPress={handleSignOut}
              >
                <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                <Text className="ml-4 text-lg text-red-500">Sign Out</Text>
              </TouchableOpacity>

              <View className="h-6" />
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
