// hooks/useAuth.ts
import { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import firebaseService from '../firebaseService';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state
    const currentUser = firebaseService.auth.currentUser;
    setUser(currentUser);
    setLoading(false);

    // Listen for auth state changes
    const unsubscribe = firebaseService.auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
};