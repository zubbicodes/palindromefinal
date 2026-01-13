import { getSupabaseClient } from '@/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser | null;
  error?: string;
  code?: string;
}

const toAuthUser = (user: any): AuthUser => {
  const displayName =
    (user?.user_metadata?.displayName as string | undefined) ??
    (user?.user_metadata?.display_name as string | undefined) ??
    null;

  return {
    id: user.id,
    email: user.email ?? null,
    displayName,
  };
};

const parseOAuthRedirectUrl = (url: string) => {
  const u = new URL(url);
  const query = u.searchParams;
  const hashParams = new URLSearchParams(u.hash.startsWith('#') ? u.hash.slice(1) : u.hash);

  const code = query.get('code') || hashParams.get('code');

  const access_token = hashParams.get('access_token') || query.get('access_token');
  const refresh_token = hashParams.get('refresh_token') || query.get('refresh_token');

  const error = query.get('error') || hashParams.get('error');
  const error_description = query.get('error_description') || hashParams.get('error_description');

  return {
    code,
    access_token,
    refresh_token,
    error,
    error_description,
  };
};

class AuthService {
  async exchangeCodeForSession(code: string): Promise<AuthResult> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return { success: false, error: error.message, code: (error as any).code };
      return { success: true, user: data.user ? toAuthUser(data.user) : null };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to complete sign in' };
    }
  }

  async setSessionFromTokens(access_token: string, refresh_token: string): Promise<AuthResult> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) return { success: false, error: error.message, code: (error as any).code };
      return { success: true, user: data.user ? toAuthUser(data.user) : null };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to complete sign in' };
    }
  }

  async completeOAuthRedirect(url: string): Promise<AuthResult> {
    try {
      const parsed = parseOAuthRedirectUrl(url);

      if (parsed.error || parsed.error_description) {
        return { success: false, error: parsed.error_description || parsed.error || 'OAuth error' };
      }

      if (parsed.code) return await this.exchangeCodeForSession(parsed.code);
      if (parsed.access_token && parsed.refresh_token) {
        return await this.setSessionFromTokens(parsed.access_token, parsed.refresh_token);
      }

      return { success: false, error: 'Missing auth code' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to complete sign in' };
    }
  }

  async signInWithGoogle(): Promise<AuthResult> {
    try {
      const supabase = getSupabaseClient();

      if (Platform.OS === 'web') {
        const origin = typeof window !== 'undefined' && window.location.origin 
          ? window.location.origin 
          : 'https://palindrome.web-testlink.com';
        
        const redirectTo = `${origin}/auth/callback`;
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo },
        });

        if (error) return { success: false, error: error.message, code: (error as any).code };
        if (data?.url) window.location.assign(data.url);
        return { success: true };
      }

      // For native mobile apps
      const redirectTo = Linking.createURL('auth/callback');
      // console.log('Native redirect URL:', redirectTo); // Debugging

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (error) return { success: false, error: error.message, code: (error as any).code };
      if (!data?.url) return { success: false, error: 'Missing OAuth URL' };

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success' || !result.url) return { success: false, error: 'Sign in canceled' };

      return await this.completeOAuthRedirect(result.url);
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to sign in with Google' };
    }
  }

  async signUp(email: string, password: string, displayName?: string): Promise<AuthResult> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: displayName ? { data: { displayName } } : undefined,
      });

      if (error) return { success: false, error: error.message, code: (error as any).code };
      return { success: true, user: data.user ? toAuthUser(data.user) : null };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to sign up' };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) return { success: false, error: error.message, code: (error as any).code };
      return { success: true, user: data.user ? toAuthUser(data.user) : null };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to sign in' };
    }
  }

  async signOut(): Promise<AuthResult> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) return { success: false, error: error.message, code: (error as any).code };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to sign out' };
    }
  }

  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message, code: (error as any).code };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to reset password' };
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return null;
      return toAuthUser(data.user);
    } catch {
      return null;
    }
  }

  // Faster method that uses local session without server verification
  async getSessionUser(): Promise<AuthUser | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session?.user) return null;
      return toAuthUser(data.session.user);
    } catch {
      return null;
    }
  }

  async getCachedProfile(userId: string) {
    try {
      const json = await AsyncStorage.getItem(`profile_cache_${userId}`);
      return json ? JSON.parse(json) : null;
    } catch (e) {
      console.error('Error reading profile cache:', e);
      return null;
    }
  }

  async saveProfileToCache(userId: string, profile: any) {
    try {
      await AsyncStorage.setItem(`profile_cache_${userId}`, JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving profile cache:', e);
    }
  }

  async getProfile(userId: string) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      // Update cache
      if (data) {
        this.saveProfileToCache(userId, data);
      }
      
      return data;
    } catch (e) {
      console.error('Error in getProfile:', e);
      return null;
    }
  }

  async updateProfile(userId: string, updates: any) {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) {
        throw error;
      }
      
      // Update cache optimistically or re-fetch
      // For simplicity and correctness, let's patch the existing cache
      const cached = await this.getCachedProfile(userId);
      if (cached) {
        const newProfile = { ...cached, ...updates };
        await this.saveProfileToCache(userId, newProfile);
      } else {
        // If no cache, try to fetch fresh
        await this.getProfile(userId);
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to update profile' };
    }
  }

  async uploadAvatar(userId: string, file: { uri: string; type: string; name?: string } | string) {
    try {
      const supabase = getSupabaseClient();
      const filePath = `${userId}/${new Date().getTime()}.jpg`;

      // Handle base64 string (web or data uri)
      if (typeof file === 'string' && file.startsWith('data:')) {
        const base64Data = file.split(',')[1];
        const { error } = await supabase.storage
          .from('avatars')
          .upload(filePath, decode(base64Data), {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (error) throw error;
      } else if (typeof file === 'object' && 'uri' in file) {
         // React Native file upload
        const response = await fetch(file.uri);
        const arrayBuffer = await response.arrayBuffer();
        
        const { error } = await supabase.storage
          .from('avatars')
          .upload(filePath, arrayBuffer, {
            contentType: file.type || 'image/jpeg',
            upsert: true,
          });
          
        if (error) throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return { success: true, publicUrl };
    } catch (e: any) {
      console.error('Upload avatar error:', e);
      return { success: false, error: e?.message || 'Failed to upload avatar' };
    }
  }
}

// Helper to decode base64 on native/web universally if needed
// For this simple case, relying on supabase-js handling or Buffer might be needed depending on environment
// But supabase-js upload accepts ArrayBuffer/Blob/File. 
// For Web: base64 -> Blob is easy.
// For Native: fetch(uri) -> blob() is standard in Expo.

// Minimal polyfill for decode if not present (mostly for web base64 handling if fetch doesn't work for data-uri)
function decode(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}


export const authService = new AuthService();
