// app/(app)/index.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth';
import { getProfile, getAllProfiles } from '../../services/profile';
import { ProfileData } from '../../types/auth';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<ProfileData | null>(null);
  const [allProfiles, setAllProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [user]);

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

          <TouchableOpacity>
            {userProfile?.photo_url ? (
              <Image
                source={{ uri: userProfile.photo_url }}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center">
                <Text className="text-gray-600 text-xl font-bold">
                  {userProfile?.username?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
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
              {allProfiles.map((profile) => (
                <TouchableOpacity
                  key={profile.id}
                  className="flex-row items-center bg-gray-50 rounded-xl p-4 mb-3"
                  activeOpacity={0.7}
                >
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

                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Sign out button */}
        <View className="px-6 py-4 mt-2 mb-6">
          <TouchableOpacity
            className="bg-red-500 py-3 rounded-lg items-center"
            onPress={signOut}
          >
            <Text className="text-white font-semibold">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
