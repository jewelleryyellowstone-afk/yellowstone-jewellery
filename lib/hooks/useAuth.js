'use client';

import { useState, useEffect } from 'react';
import { onAuthChange, getCurrentUserData } from '@/lib/firebase/auth';

/**
 * Custom hook for authentication state
 */
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (authUser) => {
            if (authUser) {
                setUser(authUser);

                // Fetch additional user data from Firestore
                const data = await getCurrentUserData();
                setUserData(data);
                setIsAdmin(data?.isAdmin || false);
            } else {
                setUser(null);
                setUserData(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return {
        user,
        userData,
        isAdmin,
        loading,
        isAuthenticated: !!user,
    };
};
