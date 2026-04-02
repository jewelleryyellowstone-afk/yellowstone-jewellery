import { NextResponse } from 'next/server';
import { getDbAdmin, ensureInitialized } from '@/lib/firebase/admin';
import { getPaymentSettings } from '@/lib/payment/settings';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PhonePe V2 API endpoints
const PHONEPE_V2_CONFIG = {
    sandbox: {
        tokenUrl: 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token',
        payUrl:   'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay',
        name: 'Sandbox (UAT)',
    },
    production: {
        tokenUrl: 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token',
        payUrl:   'https://api.phonepe.com/apis/pg/checkout/v2/pay',
        name: 'Production (LIVE)',
    },
};

/**
 * Get PhonePe V2 OAuth access token.
 * Throws with a descriptive message on failure.
 */
async function getPhonePeToken(clientId, clientSecret, clientVersion, environment) {
    const config = PHONEPE_V2_CONFIG[environment];

    const tokenBody = new URLSearchParams({
        client_id:      clientId,
        client_secret:  clientSecret,
        client_version: clientVersion,
        grant_type:     'client_credentials',
    });

    console.log(`[PhonePe] Fetching OAuth token from ${config.name}`);

    const res = await fetch(config.tokenUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    tokenBody.toString(),
    });
    const rawText = await res.text();
    console.log('[PhonePe] Raw token response:', rawText);

    let data;
    try {
        data = JSON.parse(rawText);
    } catch(e) {
        console.error('[PhonePe] Non-JSON response from token URL:', rawText);
        throw new Error(`PhonePe returned non-JSON: ${rawText.substring(0, 200)}`);
    }
    if (data.access_token) {
        console.log('[PhonePe] ✅ Token obtained');
        return data.access_token;
    }

    const errMsg = data.message || data.error_description || JSON.stringify(data);
    console.error('[PhonePe] ❌ Token error:', errMsg);

    if (errMsg.toLowerCase().includes('api mapping')) {
        const other = environment === 'sandbox' ? 'production' : 'sandbox';
        throw new Error(`AUTH_MISMATCH: Credentials belong to ${other}. Change PHONEPE_ENVIRONMENT to "${other}".`);
    }
    if (res.status === 400) {
        throw new Error(`AUTH_INVALID: Client ID or Secret is wrong. Check PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET.`);
    }
    throw new Error(`AUTH_FAILED: ${errMsg}`);
}

export async function POST(request) {
    // Hard init guard — ensure Firebase is ready before anything else
    await ensureInitialized();
    const db = await getDbAdmin();

    try {
        const body = await request.json();
        const { orderId, amount } = body;

        // --- 1. Input validation ---
        if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        if (!amount || isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // --- 2. Read PhonePe credentials from Admin Settings (Firestore) ---
        const settings = await getPaymentSettings();
        
        const clientId      = settings?.clientId?.trim();
        const clientSecret  = settings?.clientSecret?.trim();
        const clientVersion = settings?.clientVersion?.trim() || '1';
        const environment   = settings?.environment?.trim().toLowerCase() || 'sandbox';

        if (!clientId || !clientSecret) {
            console.error('[PhonePe] ❌ Missing PHONEPE credentials in Admin Settings');
            return NextResponse.json({
                error: 'Payment gateway not configured. Contact support.',
            }, { status: 500 });
        }

        if (!PHONEPE_V2_CONFIG[environment]) {
            return NextResponse.json({
                error: `Invalid PHONEPE_ENVIRONMENT in Admin Settings: "${environment}"`,
            }, { status: 500 });
        }

        // --- 3. Resolve redirect base URL ---
        const reqOrigin = new URL(request.url).origin;
        const baseUrl = (reqOrigin && !reqOrigin.includes('localhost') && reqOrigin !== 'null')
            ? reqOrigin
            : (process.env.NEXT_PUBLIC_SITE_URL || reqOrigin);

        // --- 4. Log diagnostics ---
        console.log(`[PhonePe] ▶ Order: ${orderId} | Amount: ₹${amount} | Env: ${environment}`);
        console.log(`[PhonePe] ClientId: ${clientId} | Version: ${clientVersion}`);

        // --- 5. Generate merchant order ID ---
        const merchantOrderId = `ORDER_${orderId.slice(-8)}_${Date.now()}`;

        // --- 6. Get user data from order (optional, best-effort) ---
        let merchantUserId = `MUID_${orderId.slice(-8)}`;
        try {
            const orderDoc = await db.collection('orders').doc(orderId).get();
            if (orderDoc.exists) {
                const od = orderDoc.data();
                if (od.userId) merchantUserId = `MUID_${od.userId.slice(-10)}`;
            }
        } catch (e) {
            console.warn('[PhonePe] Could not fetch order for user data:', e.message);
        }

        // --- 7. Save transaction ID on order ---
        try {
            await db.collection('orders').doc(orderId).update({
                merchantTransactionId: merchantOrderId,
                'payment.initiatedAt': new Date().toISOString(),
                'payment.status':      'initiated',
                'payment.provider':    'phonepe',
                'payment.environment': environment,
            });
        } catch (e) {
            console.warn('[PhonePe] Could not update order:', e.message);
            // Non-fatal — continue with payment
        }

        // --- 8. Get OAuth token ---
        let accessToken;
        try {
            accessToken = await getPhonePeToken(clientId, clientSecret, clientVersion, environment);
        } catch (authErr) {
            console.error('[PhonePe] Auth error:', authErr.message);
            if (authErr.message.startsWith('AUTH_MISMATCH:')) {
                return NextResponse.json({
                    error: 'PhonePe Authentication Error: ' + authErr.message.replace('AUTH_MISMATCH: ', ''),
                }, { status: 400 });
            }
            if (authErr.message.startsWith('AUTH_INVALID:')) {
                return NextResponse.json({
                    error: 'PhonePe Authentication Error: ' + authErr.message.replace('AUTH_INVALID: ', ''),
                }, { status: 400 });
            }
            return NextResponse.json({ error: 'PhonePe Auth Error: ' + authErr.message }, { status: 400 });
        }

        // --- 9. Build V2 payload ---
        const redirectUrl = `${baseUrl}/api/payment/phonepe-redirect?orderId=${orderId}`;
        const callbackUrl = `${baseUrl}/api/payment/phonepe/status`;

        const payloadData = {
            merchantOrderId: merchantOrderId,
            amount: Math.round(amount * 100), // ₹ to paise
            paymentFlow: {
                type:    'PG_CHECKOUT',
                message: 'Payment for Yellowstone Jewellery order',
                merchantUrls: {
                    redirectUrl: redirectUrl,
                },
            },
        };

        console.log(`[PhonePe] MerchantOrderId: ${merchantOrderId}`);
        console.log(`[PhonePe] RedirectUrl: ${redirectUrl}`);

        // --- 10. Call PhonePe V2 Pay API ---
        // Auth: O-Bearer token (NOT X-VERIFY checksum — that's V1/Standard PG)
        const config = PHONEPE_V2_CONFIG[environment];
        const payRes = await fetch(config.payUrl, {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `O-Bearer ${accessToken}`,
            },
            body: JSON.stringify(payloadData),
        });

        const payData = await payRes.json();
        console.log('[PhonePe] Pay API response:', JSON.stringify(payData));

        // --- 11. Handle success ---
        // V2: redirectUrl is in the top-level response
        if (payData.redirectUrl) {
            console.log('[PhonePe] ✅ Payment initiated');
            return NextResponse.json({ url: payData.redirectUrl });
        }

        // Also check nested path (older V2 format)
        const nestedUrl = payData.data?.instrumentResponse?.redirectInfo?.url;
        if (nestedUrl) {
            return NextResponse.json({ url: nestedUrl });
        }

        // Error
        console.error('[PhonePe] ❌ Pay error:', JSON.stringify(payData));
        return NextResponse.json({
            error: `PhonePe Error: ${payData.message || payData.description || payData.code || 'Unknown error'}`,
        }, { status: 400 });

    } catch (error) {
        console.error('[PhonePe] ❌ Crash:', error?.message);
        return NextResponse.json(
            { error: error.message || 'Payment initiation failed' },
            { status: 500 }
        );
    }
}
