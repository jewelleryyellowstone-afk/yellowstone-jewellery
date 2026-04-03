import { useState, useEffect } from 'react';
import { onAuthChange, getCurrentUserData } from '@/lib/supabase/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        const data = await getCurrentUserData();
        setUserData(data);
        setIsAdmin(data?.is_admin || false);
      } else {
        setUser(null);
        setUserData(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, userData, isAdmin, loading, isAuthenticated: !!user };
};
