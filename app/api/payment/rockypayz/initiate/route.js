import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ROCKYPAYZ_BASE_URL = 'https://api.rockypayz.shop';
const ROCKYPAYZ_CREATE_ORDER_URL = `${ROCKYPAYZ_BASE_URL}/api/v1/create_order`;

export async function POST(request) {
    try {
        const body = await request.json();
        const { orderId, amount, customerMobile } = body;

        // --- 1. Input validation ---
        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }
        if (!amount || isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // --- 2. Read RockyPayz credentials from Environment Variables ---
        const mid = process.env.ROCKYPAYZ_MID?.trim();
        const apiKey = process.env.ROCKYPAYZ_API_KEY?.trim();

        if (!mid || !apiKey) {
            console.error('[RockyPayz] ❌ Missing ROCKYPAYZ_MID or ROCKYPAYZ_API_KEY in environment variables');
            return NextResponse.json({
                error: 'Payment gateway not configured. Contact support.',
            }, { status: 500 });
        }

        // --- 3. Resolve redirect base URL securely via Host Header ---
        const host = request.headers.get('host') || 'localhost:3000';
        const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
        
        let baseUrl = `${protocol}://${host}`;
        
        // If deployed to production (not local), prefer the configured ENV URL
        if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
            baseUrl = process.env.NEXT_PUBLIC_SITE_URL || baseUrl;
        }

        // --- 4. Log diagnostics ---
        console.log(`[RockyPayz] ▶ Order: ${orderId} | Amount: ₹${amount} | MID: ${mid}`);

        // --- 5. Generate client transaction ID ---
        const clientTxnId = `TXN_${orderId.slice(-8)}_${Date.now()}`;

        // --- 6. Get user data from order (optional, best-effort) ---
        let mobile = customerMobile || '';
        try {
            const { data: orderDoc } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();
            if (orderDoc) {
                if (orderDoc.phone && !mobile) mobile = orderDoc.phone;
            }
        } catch (e) {
            console.warn('[RockyPayz] Could not fetch order for user data:', e.message);
        }

        if (!mobile) {
            mobile = '9999999999'; // Fallback mobile
        }

        // --- 7. Save transaction ID on order ---
        try {
            await supabaseAdmin.from('orders').update({
                payment_id: clientTxnId,
                payment_status: 'initiated',
                payment_provider: 'rockypayz',
            }).eq('id', orderId);
        } catch (e) {
            console.warn('[RockyPayz] Could not update order:', e.message);
            // Non-fatal — continue with payment
        }

        // --- 8. Build RockyPayz payload ---
        const payloadData = {
            mid: mid,
            apikey: apiKey,
            route: 2, // 2 = collection
            client_txn_id: clientTxnId,
            amount: String(Math.round(amount)),
            customer_mobile: mobile.replace(/\D/g, '').slice(-10),
        };

        console.log(`[RockyPayz] ClientTxnId: ${clientTxnId}`);
        console.log(`[RockyPayz] Payload:`, JSON.stringify(payloadData));

        // --- 9. Call RockyPayz Create Order API ---
        const payRes = await fetch(ROCKYPAYZ_CREATE_ORDER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payloadData),
        });

        const payData = await payRes.json();
        console.log('[RockyPayz] Create Order response:', JSON.stringify(payData));

        // --- 10. Handle success ---
        if (payData.status === 'True' && payData.payment_url) {
            console.log('[RockyPayz] ✅ Payment link created');
            return NextResponse.json({ url: payData.payment_url });
        }

        // Error
        console.error('[RockyPayz] ❌ Create Order error:', JSON.stringify(payData));
        return NextResponse.json({
            error: `RockyPayz Error: ${payData.msg || payData.message || payData.status || 'Unknown error'}`,
        }, { status: 400 });

    } catch (error) {
        console.error('[RockyPayz] ❌ Crash:', error?.message);
        return NextResponse.json(
            { error: error.message || 'Payment initiation failed' },
            { status: 500 }
        );
    }
}
