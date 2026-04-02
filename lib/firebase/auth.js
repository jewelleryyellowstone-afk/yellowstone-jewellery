import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';

// Admin emails list
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

/**
 * Check if user is admin
 */
export const isAdmin = async (email) => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase());
};

/**
 * Sign up new user
 */
export const signUp = async (email, password, displayName) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update profile with display name
        if (displayName) {
            await updateProfile(user, { displayName });
        }

        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: displayName || '',
            createdAt: new Date().toISOString(),
            isAdmin: await isAdmin(user.email),
        });

        return { user, error: null };
    } catch (error) {
        return { user: null, error: error.message };
    }
};

/**
 * Sign in existing user
 */
export const signIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
    } catch (error) {
        return { user: null, error: error.message };
    }
};

/**
 * Sign out current user
 */
export const logout = async () => {
    try {
        await signOut(auth);
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

/**
 * Get current user data including admin status
 */
export const getCurrentUserData = async () => {
    const user = auth.currentUser;
    if (!user) return null;

    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        // Dynamically check admin status from env to ensure it's always up to date
        const isUserAdmin = await isAdmin(user.email);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('Auth: User doc found:', userData);

            // If env says admin but DB says false, update DB to ensure Security Rules pass
            if (isUserAdmin && !userData.isAdmin) {
                console.log('Auth: Syncing isAdmin=true to Firestore...');
                try {
                    await setDoc(userDocRef, { ...userData, isAdmin: true }, { merge: true });
                    console.log('Auth: Synced isAdmin=true successfully');
                    return { ...userData, uid: user.uid, isAdmin: true };
                } catch (err) {
                    console.error('Auth: Failed to sync isAdmin:', err);
                }
            } else {
                console.log('Auth: isAdmin sync check - Env:', isUserAdmin, 'DB:', userData.isAdmin);
            }

            return {
                ...userData,
                uid: user.uid,
                // Override Firestore data with dynamic check if true
                isAdmin: isUserAdmin || userData.isAdmin
            };
        } else {
            console.log('Auth: No user doc found. Creating new...');
        }

        // Return basic data if doc doesn't exist yet
        const newUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            isAdmin: isUserAdmin,
            createdAt: new Date().toISOString()
        };

        // Create the user doc if it doesn't exist so rules can check it
        await setDoc(userDocRef, newUser);

        return newUser;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null; // Return null on error to handle gracefully
    }
};

/**
 * Listen to auth state changes
 */
export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};
