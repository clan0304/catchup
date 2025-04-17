// app/[...unmatched].tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-6xl font-bold text-gray-300 mb-4">404</Text>
        <Text className="text-2xl font-bold text-gray-800 mb-2">
          Page Not Found
        </Text>
        <Text className="text-base text-gray-600 text-center mb-8">
          The page you're looking for doesn't exist or has been moved.
        </Text>

        <TouchableOpacity
          className="bg-primary py-3 px-6 rounded-lg"
          onPress={() => router.replace('/')}
        >
          <Text className="text-white font-semibold">Go to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
