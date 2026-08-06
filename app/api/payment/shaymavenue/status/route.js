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

        const mid = (process.env.SHAYMAVENUE_MID || '').trim();
        const apikey = (process.env.SHAYMAVENUE_API_KEY || '').trim();

        if (!mid || !apikey) {
            return NextResponse.json(
                { error: 'Shaymavenue Merchant Credentials missing on server' },
                { status: 500 }
            );
        }

        const payload = {
            mid,
            apikey,
            client_txn_id: String(orderId),
            route: 'collection',
        };

        const res = await fetch('https://shaymavenue.in/api/v1/check_status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        const statusStr = (data.status || data.TXN_Status || data.result || '').toString().toLowerCase();

        if (statusStr === 'success' || statusStr === 'successful') {
            await updateDocument('orders', orderId, {
                payment_status: 'paid',
                status: 'processing',
                updated_at: new Date().toISOString(),
            });
            return NextResponse.json({ status: 'SUCCESS', data });
        } else if (statusStr === 'failed' || statusStr === 'failure') {
            await updateDocument('orders', orderId, {
                payment_status: 'failed',
                updated_at: new Date().toISOString(),
            });
            return NextResponse.json({ status: 'FAILED', data });
        } else {
            return NextResponse.json({ status: 'PENDING', data });
        }
    } catch (error) {
        console.error('Shaymavenue Check Status Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
