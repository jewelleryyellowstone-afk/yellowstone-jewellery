// lib/firebase/admin.js
// Dynamic import pattern — bypasses firebase-frameworks Webpack bundler

let adminInstance = null;

async function getAdmin() {
    if (adminInstance) return adminInstance;
    const admin = (await import('firebase-admin')).default;
    if (admin.apps.length === 0) {
        if (process.env.ADMIN_CLIENT_EMAIL && process.env.ADMIN_PRIVATE_KEY) {
            console.log('[FirebaseAdmin] Initializing with service account.');
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId:   process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    clientEmail: process.env.ADMIN_CLIENT_EMAIL,
                    privateKey:  process.env.ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });
        } else {
            console.log('[FirebaseAdmin] Initializing with ADC.');
            admin.initializeApp();
        }
        console.log('[FirebaseAdmin] ✅ Ready.');
    } else {
        console.log('[FirebaseAdmin] Reusing existing instance.');
    }
    adminInstance = admin;
    return admin;
}

export async function getDbAdmin() {
    const admin = await getAdmin();
    return admin.firestore();
}

export async function getAuthAdmin() {
    const admin = await getAdmin();
    return admin.auth();
}

export async function ensureInitialized() {
    await getAdmin();
}

// TEMPORARY — remove after all files migrated
export const dbAdmin = {
    collection: (...args) => { throw new Error('Use await getDbAdmin() instead') },
    doc:        (...args) => { throw new Error('Use await getDbAdmin() instead') },
    batch:      ()        => { throw new Error('Use await getDbAdmin() instead') },
    runTransaction: (fn)  => { throw new Error('Use await getDbAdmin() instead') },
};

export const authAdmin = {
    verifyIdToken:       (...args) => { throw new Error('Use await getAuthAdmin() instead') },
    getUser:             (...args) => { throw new Error('Use await getAuthAdmin() instead') },
    createUser:          (...args) => { throw new Error('Use await getAuthAdmin() instead') },
    updateUser:          (...args) => { throw new Error('Use await getAuthAdmin() instead') },
    listUsers:           (...args) => { throw new Error('Use await getAuthAdmin() instead') },
    setCustomUserClaims: (...args) => { throw new Error('Use await getAuthAdmin() instead') },
};
