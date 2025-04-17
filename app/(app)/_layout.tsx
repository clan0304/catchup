// app/(app)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '../../context/auth';
import { Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
  const { user, loading } = useAuth();

  // If not authenticated, redirect to auth
  if (!user && !loading) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#5E72E4', // Primary color
        tabBarInactiveTintColor: '#9CA3AF', // Gray-400
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB', // Gray-200
          elevation: 0,
          height: 60,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="connections"
        options={{
          title: 'Connections',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile-setup"
        options={{
          href: null, // Hide this from the tab bar
        }}
      />
    </Tabs>
  );
}
