import { NextResponse } from 'next/server';
import { updateDocument, getDocument } from '@/lib/supabase/db';

export async function POST(req) {
    try {
        const { orderId } = await req.json();

        if (!orderId) {
            return NextResponse.json(
                { error: 'orderId is required' },
                { status: 400 }
            );
        }

        const mid = (process.env.SHAYMAVENUE_MID || 'SHYAM4554073600').trim();
        const apikey = (process.env.SHAYMAVENUE_API_KEY || 'Q7@Lm4#Xt9!Rw2&Ks').trim();

        const clientTxnId = String(orderId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);

        const payload = {
            mid,
            apikey,
            client_txn_id: clientTxnId,
            route: 1, // Integer: 1 for Payin / Collection status check as per specification
        };

        const res = await fetch('https://shaymavenue.in/api/v1/check_status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        let data = {};
        try {
            data = await res.json();
        } catch (jsonErr) {
            console.error('Failed to parse Shaymavenue check_status JSON:', jsonErr);
        }

        const txnStatus = (data.data?.status || data.TXN_Status || data.status || '').toString().toUpperCase();

        if (data.status === true || txnStatus === 'SUCCESS' || txnStatus === 'SUCCESSFUL') {
            try {
                await updateDocument('orders', orderId, {
                    payment_status: 'paid',
                    status: 'processing',
                    updated_at: new Date().toISOString(),
                });
            } catch (dbErr) {
                console.error('DB Order Update Error:', dbErr);
            }
            return NextResponse.json({ status: 'SUCCESS', data });
        } else if (txnStatus === 'FAILED' || txnStatus === 'FAILURE' || (data.status === false && data.msg?.toLowerCase().includes('failed'))) {
            try {
                await updateDocument('orders', orderId, {
                    payment_status: 'failed',
                    updated_at: new Date().toISOString(),
                });
            } catch (dbErr) {
                console.error('DB Order Update Error:', dbErr);
            }
            return NextResponse.json({ status: 'FAILED', data });
        } else {
            return NextResponse.json({ status: 'PENDING', data });
        }
    } catch (error) {
        console.error('Shaymavenue Check Status Error:', error);
        return NextResponse.json(
            { status: 'PENDING', error: error.message || 'Check status failed' },
            { status: 200 }
        );
    }
}
