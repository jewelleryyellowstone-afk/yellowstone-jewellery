import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

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
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
    
    let baseUrl = `${protocol}://${host}`;
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
        baseUrl = process.env.NEXT_PUBLIC_SITE_URL || baseUrl;
    }

    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) return NextResponse.redirect(`${baseUrl}/cart?error=missing_order`);

        // Fetch order from Supabase
        const { data: orderDoc } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();
        if (!orderDoc) return NextResponse.redirect(`${baseUrl}/cart?error=invalid_order`);

        const merchantTransactionId = orderDoc.merchant_transaction_id;
        const paymentStatus = orderDoc.payment_status;

        // Already confirmed paid
        if (paymentStatus === 'paid') {
            return NextResponse.redirect(`${baseUrl}/order-success?orderId=${orderId}`);
        }

        if (!merchantTransactionId) {
            console.error(`[PhonePe Redirect] No merchant_transaction_id for order ${orderId}`);
            return NextResponse.redirect(`${baseUrl}/cart?error=invalid_transaction`);
        }

        // Read credentials from Environment Variables
        const environment = process.env.PHONEPE_ENVIRONMENT?.toLowerCase() === 'production' ? 'production' : 'sandbox';
        const isProd = environment === 'production';
        const clientId = isProd ? process.env.PHONEPE_PROD_CLIENT_ID?.trim() : process.env.PHONEPE_TEST_CLIENT_ID?.trim();
        const clientSecret = isProd ? process.env.PHONEPE_PROD_CLIENT_SECRET?.trim() : process.env.PHONEPE_TEST_CLIENT_SECRET?.trim();
        const clientVersion = isProd ? process.env.PHONEPE_PROD_CLIENT_VERSION?.trim() || '1' : process.env.PHONEPE_TEST_CLIENT_VERSION?.trim() || '1';

        if (!clientId || !clientSecret || !PHONEPE_V2_CONFIG[environment]) {
            console.error('[PhonePe Redirect] Missing PhonePe credentials in Environment Variables');
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
            await supabaseAdmin.from('orders').update({
                payment_status: 'paid',
                status:         'processing'
            }).eq('id', orderId);
            
            // Fire notification non-blocking
            fetch(`${baseUrl}/api/notifications`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ orderId, type: 'order_placed' }),
            }).catch(e => console.error('[PhonePe Redirect] Notification failed:', e));

            return NextResponse.redirect(`${baseUrl}/order-success?orderId=${orderId}`);

        } else if (state === 'FAILED') {
            await supabaseAdmin.from('orders').update({
                payment_status: 'failed'
            }).eq('id', orderId);
            
            return NextResponse.redirect(`${baseUrl}/cart?error=payment_failed`);
        }

        // PENDING / unknown
        return NextResponse.redirect(`${baseUrl}/order-success?orderId=${orderId}&status=pending`);

    } catch (error) {
        console.error('[PhonePe Redirect] Error:', error);
        return NextResponse.redirect(`${baseUrl}/cart?error=status_error`);
    }
}
