// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { authService, type AuthUser } from '@/authService';
import { getSupabaseClient } from '@/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();

    void (async () => {
      const current = await authService.getCurrentUser();
      if (!isMounted) return;
      setUser(current);
      setLoading(false);
    })();

    const { data } = supabase.auth.onAuthStateChange(async () => {
      const current = await authService.getCurrentUser();
      if (!isMounted) return;
      setUser(current);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
};
