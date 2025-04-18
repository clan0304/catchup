// app/(auth)/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuth } from '@/context/auth';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle(true); // Pass true to prompt for account selection
    } catch (error) {
      console.error('Google sign in error:', error);
    } finally {
      // Only reset loading state on web, as mobile redirects away
      if (Platform.OS === 'web') {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-3xl font-bold text-gray-800 mb-2">
          Welcome to AppName
        </Text>
        <Text className="text-base text-gray-600 mb-12">
          Sign in to continue
        </Text>

        <View className="w-full max-w-xs">
          <TouchableOpacity
            className="flex-row items-center justify-center bg-white rounded-lg py-4 border border-gray-200"
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#5E72E4" className="mr-2" />
            ) : (
              <Image
                source={{
                  uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg',
                }}
                className="w-5 h-5 mr-3"
              />
            )}
            <Text className="text-base font-semibold text-gray-800">
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="absolute bottom-10 px-6">
          <Text className="text-xs text-gray-500 text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
