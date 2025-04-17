// types/auth.ts
import { Session, User } from '@supabase/supabase-js';

// types/auth.ts (Updated ProfileData type)

export type ProfileData = {
  id?: string; // Added id field
  username: string;
  instagram_url: string;
  city: string;
  photo_url?: string;
  interests: string[];
  bio: string;
  created_at?: string; // Added timestamp
  updated_at?: string; // Added timestamp
};




export type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkUsernameUnique: (username: string) => Promise<boolean>;
  completeProfile: (profileData: ProfileData) => Promise<{ error: any | null }>;
  uploadProfilePhoto: (
    uri: string
  ) => Promise<{ url: string | null; error: any | null }>;
  profileComplete: boolean;
};
