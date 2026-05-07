import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ROCKYPAYZ_BASE_URL = 'https://api.rockypayz.shop';
const ROCKYPAYZ_STATUS_URL = `${ROCKYPAYZ_BASE_URL}/api/v1/check_order_status`;

// Handles user returning from RockyPayz checkout (GET redirect)
export async function GET(request) {
    return handleRedirect(request);
}

// RockyPayz sometimes POSTs the redirect
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

        const clientTxnId = orderDoc.payment_id;
        const paymentStatus = orderDoc.payment_status;

        // Already confirmed paid
        if (paymentStatus === 'paid') {
            return NextResponse.redirect(`${baseUrl}/order-success?orderId=${orderId}`);
        }

        if (!clientTxnId) {
            console.error(`[RockyPayz Redirect] No payment_id for order ${orderId}`);
            return NextResponse.redirect(`${baseUrl}/cart?error=invalid_transaction`);
        }

        // Read credentials from Environment Variables
        const mid = process.env.ROCKYPAYZ_MID?.trim();
        const apiKey = process.env.ROCKYPAYZ_API_KEY?.trim();

        if (!mid || !apiKey) {
            console.error('[RockyPayz Redirect] Missing RockyPayz credentials in Environment Variables');
            return NextResponse.redirect(`${baseUrl}/cart?error=config_error`);
        }

        // Call RockyPayz status API
        const payloadData = {
            mid: mid,
            apikey: apiKey,
            route: 2,
            client_txn_id: clientTxnId,
        };

        const statusRes = await fetch(ROCKYPAYZ_STATUS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payloadData),
        });

        const data = await statusRes.json();
        console.log(`[RockyPayz Redirect] Status for ${clientTxnId}:`, JSON.stringify(data));

        const txnStatus = data?.data?.status;

        if (txnStatus === 'Success') {
            await supabaseAdmin.from('orders').update({
                payment_status: 'paid',
                status:         'processing'
            }).eq('id', orderId);
            
            // Fire notification non-blocking
            fetch(`${baseUrl}/api/notifications`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ orderId, type: 'order_placed' }),
            }).catch(e => console.error('[RockyPayz Redirect] Notification failed:', e));

            return NextResponse.redirect(`${baseUrl}/order-success?orderId=${orderId}`);

        } else if (txnStatus === 'Failed') {
            await supabaseAdmin.from('orders').update({
                payment_status: 'failed'
            }).eq('id', orderId);
            
            return NextResponse.redirect(`${baseUrl}/cart?error=payment_failed`);
        }

        // PENDING / unknown
        return NextResponse.redirect(`${baseUrl}/order-success?orderId=${orderId}&status=pending`);

    } catch (error) {
        console.error('[RockyPayz Redirect] Error:', error);
        return NextResponse.redirect(`${baseUrl}/cart?error=status_error`);
    }
}
