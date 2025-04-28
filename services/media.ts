// services/media.ts
import { supabase } from '../lib/supabase';

/**
 * Upload media (image or video) to Supabase storage
 * @param userId - User ID
 * @param uri - Local URI of the file to upload
 * @param mediaType - Type of media ('image' or 'video')
 * @returns Object with public URL or error
 */
export async function uploadChatMedia(
  userId: string,
  uri: string,
  mediaType: 'image' | 'video'
): Promise<{ url: string | null; error: any | null }> {
  try {
    // Convert URI to Blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Generate unique filename with proper extension
    const fileExt =
      uri.split('.').pop()?.toLowerCase() ||
      (mediaType === 'image' ? 'jpg' : 'mp4');

    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to Supabase Storage in the chat_media bucket
    const { error: uploadError } = await supabase.storage
      .from('chat_media')
      .upload(filePath, blob);

    if (uploadError) {
      console.error('Error uploading media:', uploadError);
      return { url: null, error: uploadError };
    }

    // Get public URL
    const { data } = supabase.storage.from('chat_media').getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Error in uploadChatMedia:', error);
    return { url: null, error };
  }
}
