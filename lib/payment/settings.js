import { getDbAdmin } from '@/lib/firebase/admin';

// Simple in-memory cache — avoids redundant Firestore reads
let cachedSettings = null;
let lastFetchTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Reads PhonePe settings from Firestore settings/payment document.
 * Caches for 1 hour. Call invalidatePaymentSettingsCache() to force refresh.
 */
export async function getPaymentSettings() {
    if (cachedSettings && (Date.now() - lastFetchTime < CACHE_TTL)) {
        return cachedSettings;
    }

    const db = await getDbAdmin();
    const doc = await db.collection('settings').doc('payment').get();

    if (doc.exists) {
        cachedSettings = doc.data();
        lastFetchTime = Date.now();
        return cachedSettings;
    }

    return null;
}

export function invalidatePaymentSettingsCache() {
    cachedSettings = null;
    lastFetchTime = 0;
}
