// lib/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill';

// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Check if we're in a browser/React Native environment or server environment
const isClient = typeof window !== 'undefined';

// Create a custom storage interface for client environments
const createCustomStorage = () => {
  return {
    getItem: async (key: string) => {
      try {
        if (Platform.OS === 'web') {
          const value = localStorage.getItem(key);
          return value;
        } else {
          if (key === 'supabase.auth.token') {
            return await SecureStore.getItemAsync(key);
          }
          return await AsyncStorage.getItem(key);
        }
      } catch (error) {
        console.error('Error getting item from storage:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        if (Platform.OS === 'web') {
          localStorage.setItem(key, value);
        } else {
          if (key === 'supabase.auth.token') {
            await SecureStore.setItemAsync(key, value);
          } else {
            await AsyncStorage.setItem(key, value);
          }
        }
      } catch (error) {
        console.error('Error setting item in storage:', error);
      }
    },
    removeItem: async (key: string) => {
      try {
        if (Platform.OS === 'web') {
          localStorage.removeItem(key);
        } else {
          if (key === 'supabase.auth.token') {
            await SecureStore.deleteItemAsync(key);
          } else {
            await AsyncStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.error('Error removing item from storage:', error);
      }
    },
  };
};

// Initialize the Supabase client with appropriate storage options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isClient ? (createCustomStorage() as any) : undefined,
    autoRefreshToken: isClient,
    persistSession: isClient,
    detectSessionInUrl: isClient,
  },
});

// Set up AppState listener to refresh token when app comes back to foreground (only in client environment)
if (isClient && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.refreshSession();
    }
  });
}
