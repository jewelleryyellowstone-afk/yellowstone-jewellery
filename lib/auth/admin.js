import { getAuthAdmin, getDbAdmin } from '@/lib/firebase/admin';

/**
 * Verifies that the request is made by an authenticated admin user.
 * @param {Request} request 
 * @returns {Promise<boolean>}
 */
export async function verifyAdminRequest(request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            console.log('Admin verify: No Bearer token');
            return false;
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;

        try {
            const auth = await getAuthAdmin();
            decodedToken = await auth.verifyIdToken(token);
        } catch (e) {
            console.log('Admin verify: Token verification failed', e.message);
        }

        // Check if we are using the mock admin (build time or missing creds)
        const isMockInstance = !decodedToken || decodedToken.email === 'build@test.com';

        if (isMockInstance) {
            // FALLBACK FOR DEVELOPMENT ONLY:
            // If the Admin SDK is not configured (mock mode), we try to decode the token insecurely
            // to unblock the user on localhost.
            if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SITE_URL?.includes('localhost')) {
                try {
                    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim());

                    if (payload.email && adminEmails.includes(payload.email)) {
                        console.warn('⚠️ Admin Verification: Using insecure fallback for development (Missing Service Account)');
                        return true;
                    }
                } catch (err) {
                    console.error('Admin verify fallback failed', err);
                }
            }
            return false;
        }

        // Check Firestore for isAdmin field
        const db = await getDbAdmin();
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        const isAdmin = userDoc.exists && userDoc.data()?.isAdmin === true;

        if (!isAdmin) {
            console.log(`Admin verify failed: User ${decodedToken.email} (${decodedToken.uid}) is not an admin.`);
        }

        return isAdmin;
    } catch (error) {
        console.error('Admin verification failed:', error);
        return false;
    }
}
