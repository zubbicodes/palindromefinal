import { getSupabaseClient } from '@/supabase';
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
        const redirectTo = `${window.location.origin}/auth/callback`;
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo },
        });

        if (error) return { success: false, error: error.message, code: (error as any).code };
        if (data?.url) window.location.assign(data.url);
        return { success: true };
      }

      const redirectTo = Linking.createURL('auth/callback');
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
}

export const authService = new AuthService();
