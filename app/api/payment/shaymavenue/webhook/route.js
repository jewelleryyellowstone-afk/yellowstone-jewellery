import { NextResponse } from 'next/server';
import { updateDocument } from '@/lib/supabase/db';

export async function POST(req) {
    try {
        const body = await req.json();
        console.log('Shaymavenue Webhook Payload Received:', body);

        // Webhook can be an array of transactions or a single transaction object
        const txns = Array.isArray(body) ? body : [body];

        for (const txn of txns) {
            const clientTxnId = txn.Txn_ID || txn.client_txn_id || txn.order_id;
            const status = (txn.TXN_Status || txn.status || '').toString().toLowerCase();
            const utr = txn.UTR || txn.utr || '';

            if (clientTxnId) {
                if (status === 'success') {
                    await updateDocument('orders', clientTxnId, {
                        payment_status: 'paid',
                        status: 'processing',
                        transaction_id: utr || clientTxnId,
                        updated_at: new Date().toISOString(),
                    });
                    
                    // Trigger order notification
                    try {
                        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/notifications`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: clientTxnId, type: 'order_placed' }),
                        });
                    } catch (notifyErr) {
                        console.error('Webhook notification trigger error:', notifyErr);
                    }
                } else if (status === 'failed') {
                    await updateDocument('orders', clientTxnId, {
                        payment_status: 'failed',
                        updated_at: new Date().toISOString(),
                    });
                }
            }
        }

        return new Response('OK', { status: 200 });
    } catch (error) {
        console.error('Shaymavenue Webhook Error:', error);
        return new Response('Internal Error', { status: 500 });
    }
}
