import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEVORIX_BASE_URL = 'https://api.devorixsolutions.net/api';
const DEVORIX_CREATE_PAYMENT_URL = `${DEVORIX_BASE_URL}/CreatePaymentLink`;

export async function POST(request) {
    try {
        const body = await request.json();
        const { orderId, amount, customerName, customerEmail, customerMobile } = body;

        if (!orderId || !amount) {
            return NextResponse.json({ error: 'Missing orderId or amount' }, { status: 400 });
        }

        const secretKey = process.env.DEVORIX_SECRET_KEY?.trim();
        const salt = process.env.DEVORIX_SALT?.trim();

        if (!secretKey || !salt) {
            console.error('[Devorix] ❌ Missing Devorix credentials');
            return NextResponse.json({ error: 'Payment gateway not configured.' }, { status: 500 });
        }

        const clientTxnId = `${orderId}_${Date.now()}`;
        
        let mobile = customerMobile || '9999999999';
        let name = customerName || 'Customer';
        let email = customerEmail || 'customer@example.com';
        
        // Save transaction ID on order
        try {
            await supabaseAdmin.from('orders').update({
                payment_id: clientTxnId,
                payment_status: 'initiated',
                payment_provider: 'devorix',
            }).eq('id', orderId);
        } catch (e) {
            console.warn('[Devorix] Could not update order:', e.message);
        }

        const payloadData = {
            secretkey: secretKey,
            salt: salt,
            PhoneNo: mobile.replace(/\D/g, '').slice(-10),
            Name: name,
            EmailId: email,
            Amount: String(Math.round(amount)),
            MerRefNo: clientTxnId
        };

        console.log(`[Devorix] Payload:`, JSON.stringify(payloadData));

        const payRes = await fetch(DEVORIX_CREATE_PAYMENT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadData),
        });

        const payData = await payRes.json();
        console.log('[Devorix] CreatePaymentLink response:', JSON.stringify(payData));

        if (payData.Status === "1" && payData.Transaction && payData.Transaction.length > 0) {
            const txn = payData.Transaction[0];
            // Devorix returns qrIntent which is a UPI intent string
            const paymentUrl = txn.qrIntent || txn.payment_url || txn.url || txn.YourIntent;
            
            if (paymentUrl) {
                console.log('[Devorix] ✅ Payment link created');
                return NextResponse.json({ url: paymentUrl, type: txn.qrIntent ? 'upi_intent' : 'url' });
            } else {
                return NextResponse.json({ error: 'No payment URL returned from gateway' }, { status: 400 });
            }
        }

        console.error('[Devorix] ❌ Create Order error payload:', JSON.stringify(payData));
        const errMsg = payData.Message || payData.message || (typeof payData === 'string' ? payData : JSON.stringify(payData));
        return NextResponse.json({
            error: `Devorix Error: ${errMsg}`,
        }, { status: 400 });

    } catch (error) {
        console.error('[Devorix] ❌ Crash:', error?.message);
        return NextResponse.json(
            { error: error.message || 'Payment initiation failed' },
            { status: 500 }
        );
    }
}
