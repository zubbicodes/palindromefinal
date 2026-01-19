import { authService, type AuthUser } from '@/authService';
import { getSupabaseClient } from '@/supabase';
import { useEffect, useState } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();

    void (async () => {
      const current = await authService.getSessionUser();
      if (current) {
        void authService.ensureProfile(current);
      }
      if (!isMounted) return;
      setUser(current);
      setLoading(false);
    })();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      const current = session?.user
        ? {
            id: session.user.id,
            email: session.user.email ?? null,
            displayName:
              (session.user.user_metadata?.displayName ??
                session.user.user_metadata?.display_name ??
                null) as string | null,
          }
        : null;

      if (current && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        void authService.ensureProfile(current);
      }
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
