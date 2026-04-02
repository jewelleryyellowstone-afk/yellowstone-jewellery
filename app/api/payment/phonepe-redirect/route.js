import { NextResponse } from 'next/server';
import { getDbAdmin, ensureInitialized } from '@/lib/firebase/admin';
import { getPaymentSettings } from '@/lib/payment/settings';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// V2 API endpoints (mirror of initiate/route.js)
const PHONEPE_V2_CONFIG = {
    sandbox: {
        tokenUrl:  'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token',
        statusUrl: 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order',
    },
    production: {
        tokenUrl:  'https://api.phonepe.com/apis/identity-manager/v1/oauth/token',
        statusUrl: 'https://api.phonepe.com/apis/pg/checkout/v2/order',
    },
};

async function getPhonePeToken(clientId, clientSecret, clientVersion, environment) {
    const { tokenUrl } = PHONEPE_V2_CONFIG[environment];
    const tokenBody = new URLSearchParams({
        client_id:      clientId,
        client_secret:  clientSecret,
        client_version: clientVersion,
        grant_type:     'client_credentials',
    });
    const res = await fetch(tokenUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    tokenBody.toString(),
    });

    const rawText = await res.text();
    console.log('[PhonePe Redirect] Raw token response:', rawText);

    let data;
    try {
        data = JSON.parse(rawText);
    } catch(e) {
        console.error('[PhonePe Redirect] Non-JSON response from token URL:', rawText);
        throw new Error(`PhonePe returned non-JSON: ${rawText.substring(0, 200)}`);
    }

    if (!data.access_token) {
        throw new Error(`Token error: ${data.message || JSON.stringify(data)}`);
    }
    return data.access_token;
}

// Handles user returning from PhonePe checkout (GET redirect)
export async function GET(request) {
    return handleRedirect(request);
}

// PhonePe sometimes POSTs the redirect
export async function POST(request) {
    return handleRedirect(request);
}

async function handleRedirect(request) {
    const reqOrigin = new URL(request.url).origin;
    const baseUrl = (reqOrigin && !reqOrigin.includes('localhost') && reqOrigin !== 'null')
        ? reqOrigin
        : (process.env.NEXT_PUBLIC_SITE_URL || reqOrigin);

    try {
        await ensureInitialized();
        const db = await getDbAdmin();

        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) return NextResponse.redirect(`${baseUrl}/cart?error=missing_order`);

        // Fetch order
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) return NextResponse.redirect(`${baseUrl}/cart?error=invalid_order`);

        const { merchantTransactionId, paymentStatus } = orderDoc.data();

        // Already confirmed paid
        if (paymentStatus === 'paid') {
            return NextResponse.redirect(`${baseUrl}/order-success?orderId=${orderId}`);
        }

        if (!merchantTransactionId) {
            console.error(`[PhonePe Redirect] No merchantTransactionId for order ${orderId}`);
            return NextResponse.redirect(`${baseUrl}/cart?error=invalid_transaction`);
        }

        // Read credentials from Admin Settings (same as initiate route)
        const settings = await getPaymentSettings();
        
        const clientId      = settings?.clientId?.trim();
        const clientSecret  = settings?.clientSecret?.trim();
        const clientVersion = settings?.clientVersion?.trim() || '1';
        const environment   = settings?.environment?.trim().toLowerCase() || 'sandbox';

        if (!clientId || !clientSecret || !PHONEPE_V2_CONFIG[environment]) {
            console.error('[PhonePe Redirect] Missing PhonePe credentials in Admin Settings');
            return NextResponse.redirect(`${baseUrl}/cart?error=config_error`);
        }

        // Get OAuth token
        let accessToken;
        try {
            accessToken = await getPhonePeToken(clientId, clientSecret, clientVersion, environment);
        } catch (e) {
            console.error('[PhonePe Redirect] Token error:', e.message);
            return NextResponse.redirect(`${baseUrl}/cart?error=auth_error`);
        }

        // V2 status check: GET /checkout/v2/order/{merchantOrderId}/status
        const { statusUrl } = PHONEPE_V2_CONFIG[environment];
        const statusRes = await fetch(`${statusUrl}/${merchantTransactionId}/status`, {
            method:  'GET',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `O-Bearer ${accessToken}`,
            },
        });

        const data = await statusRes.json();
        console.log(`[PhonePe Redirect] Status for ${merchantTransactionId}:`, JSON.stringify(data));

        // V2 response: top-level `state` field
        const state = data?.state || data?.data?.state;

        if (state === 'COMPLETED') {
            await db.collection('orders').doc(orderId).update({
                paymentStatus: 'paid',
                status:        'processing',
                updatedAt:     new Date().toISOString(),
            });
            // Fire notification non-blocking
            fetch(`${baseUrl}/api/notifications`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ orderId, type: 'order_placed' }),
            }).catch(e => console.error('[PhonePe Redirect] Notification failed:', e));

            return NextResponse.redirect(`${baseUrl}/order-success?orderId=${orderId}`);

        } else if (state === 'FAILED') {
            await db.collection('orders').doc(orderId).update({
                paymentStatus: 'failed',
                updatedAt:     new Date().toISOString(),
            });
            return NextResponse.redirect(`${baseUrl}/cart?error=payment_failed`);
        }

        // PENDING / unknown
        return NextResponse.redirect(`${baseUrl}/order-success?orderId=${orderId}&status=pending`);

    } catch (error) {
        console.error('[PhonePe Redirect] Error:', error);
        return NextResponse.redirect(`${baseUrl}/cart?error=status_error`);
    }
}
