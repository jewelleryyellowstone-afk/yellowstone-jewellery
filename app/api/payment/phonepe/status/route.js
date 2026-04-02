import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDbAdmin, ensureInitialized } from '@/lib/firebase/admin';
import { getPaymentSettings } from '@/lib/payment/settings';

// Force dynamic rendering - required for Firebase App Hosting / Cloud Functions
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        await ensureInitialized();
        const db = await getDbAdmin();

        const { searchParams } = new URL(request.url);
        const transactionId = searchParams.get('transactionId');
        
        if (!transactionId) {
            return NextResponse.json({ error: 'Missing transactionId parameter' }, { status: 400 });
        }

        const settings = await getPaymentSettings();
        if (!settings?.merchantId || !settings?.saltKey || !settings?.saltIndex || !settings?.environment) {
            return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
        }

        const merchantId = settings.merchantId?.trim() || '';
        const saltKey = settings.saltKey?.trim() || '';
        const saltIndex = settings.saltIndex?.toString().trim() || '1';

        // Standardise orderId from merchantTransactionId
        let orderId = transactionId;
        if (transactionId.includes('_')) {
            orderId = transactionId.split('_')[0];
        }

        // Use configured environment for Sandbox vs Production API
        const isProd = settings.environment === 'production';
        const endpoint = `/pg/v1/status/${merchantId}/${transactionId}`; // This is the path part for checksum
        const STATUS_API_BASE_URL = isProd
            ? `https://api.phonepe.com/apis/hermes`
            : `https://api-preprod.phonepe.com/apis/pg-sandbox`;
        const phonePeUrl = `${STATUS_API_BASE_URL}${endpoint}`;

        const stringToSign = endpoint + saltKey;
        const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
        const checksum = sha256 + '###' + saltIndex;

        const response = await fetch(phonePeUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'X-MERCHANT-ID': merchantId
            }
        });

        const data = await response.json();

        if (data.success && data.data) {
            const state = data.data.state;
            const orderDoc = await db.collection('orders').doc(orderId).get();
            
            if (orderDoc.exists) {
                const orderData = orderDoc.data();
                
                // Keep synchronization only if our internal state is behind
                if (orderData.paymentStatus !== 'paid' && state === 'COMPLETED') {
                     await db.collection('orders').doc(orderId).update({
                        paymentStatus: 'paid',
                        status: 'processing',
                        updatedAt: new Date().toISOString()
                    });
                } else if (orderData.paymentStatus === 'pending' && state === 'FAILED') {
                     await db.collection('orders').doc(orderId).update({
                        paymentStatus: 'failed',
                        updatedAt: new Date().toISOString()
                    });
                }
            }
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('PhonePe Check Status API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
