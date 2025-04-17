// services/profile.ts
import { supabase } from '../lib/supabase';
import { ProfileData } from '../types/auth';

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return { profile: null, error };
  }

  return { profile: data, error: null };
}

// Function to get all profiles
export async function getAllProfiles() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all profiles:', error);
      return { profiles: [], error };
    }

    return { profiles: data || [], error: null };
  } catch (error) {
    console.error('Exception fetching all profiles:', error);
    return { profiles: [], error };
  }
}

export async function updateProfile(
  userId: string,
  profileData: Partial<ProfileData>
) {
  const { error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', userId);

  return { error };
}

export async function checkUsernameUnique(username: string) {
  const { data, error } = await supabase.rpc('check_username_unique', {
    new_username: username,
  });

  if (error) {
    console.error('Error checking username:', error);
    return false;
  }

  return data === true;
}

export async function uploadProfilePhoto(userId: string, uri: string) {
  try {
    // Convert URI to Blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Generate unique filename
    const fileExt = uri.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('profile_photos')
      .upload(filePath, blob);

    if (uploadError) {
      return { url: null, error: uploadError };
    }

    // Get public URL
    const { data } = supabase.storage
      .from('profile_photos')
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { url: null, error };
  }
}

// Define interest categories for the app
export const INTEREST_OPTIONS = [
  'Sports',
  'Music',
  'Art',
  'Food',
  'Travel',
  'Technology',
  'Gaming',
  'Fashion',
  'Photography',
  'Reading',
  'Fitness',
  'Cooking',
  'Nature',
  'Movies',
  'Dancing',
];
