// app/index.tsx
import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '../context/auth';

/**
 * Root index page that redirects based on authentication state:
 * - If loading: Show loading screen
 * - If authenticated but profile incomplete: Redirect to profile setup
 * - If authenticated with complete profile: Redirect to home
 * - If not authenticated: Redirect to auth page
 */
export default function Index() {
  const { user, loading, profileComplete } = useAuth();

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#5E72E4" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  // Handle redirection based on auth state
  if (user) {
    if (!profileComplete) {
      return <Redirect href="/(app)/profile-setup" />;
    }
    return <Redirect href="/(app)" />;
  }

  // Not authenticated, redirect to auth page
  return <Redirect href="/(auth)" />;
}
