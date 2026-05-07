import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Force dynamic rendering - required
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ROCKYPAYZ_BASE_URL = 'https://api.rockypayz.shop';
const ROCKYPAYZ_STATUS_URL = `${ROCKYPAYZ_BASE_URL}/api/v1/check_order_status`;

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const transactionId = searchParams.get('transactionId');
        const orderId = searchParams.get('orderId');
        
        if (!transactionId && !orderId) {
            return NextResponse.json({ error: 'Missing transactionId or orderId parameter' }, { status: 400 });
        }

        const mid = process.env.ROCKYPAYZ_MID?.trim();
        const apiKey = process.env.ROCKYPAYZ_API_KEY?.trim();

        if (!mid || !apiKey) {
            return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
        }

        // Resolve transaction ID
        let clientTxnId = transactionId;

        if (!clientTxnId && orderId) {
            const { data: orderData } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();
            if (orderData) {
                clientTxnId = orderData.payment_id;
            }
        }

        if (!clientTxnId) {
            return NextResponse.json({ error: 'Transaction ID not found' }, { status: 404 });
        }

        const payloadData = {
            mid: mid,
            apikey: apiKey,
            route: 2,
            client_txn_id: clientTxnId,
        };

        const response = await fetch(ROCKYPAYZ_STATUS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payloadData),
        });

        const data = await response.json();

        if (data.status === true && data.data) {
            const txnStatus = data.data.status;
            
            const { data: orderData } = await supabaseAdmin.from('orders').select('*').eq('payment_id', clientTxnId).single();
            
            if (orderData) {
                const oid = orderData.id;
                // Keep synchronization only if our internal state is behind
                if (orderData.payment_status !== 'paid' && txnStatus === 'Success') {
                     await supabaseAdmin.from('orders').update({
                        payment_status: 'paid',
                        status: 'processing'
                    }).eq('id', oid);
                } else if (orderData.payment_status === 'pending' && txnStatus === 'Failed') {
                     await supabaseAdmin.from('orders').update({
                        payment_status: 'failed'
                    }).eq('id', oid);
                }
            }
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('RockyPayz Check Status API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { transactionId, orderId } = body;
        
        if (!transactionId && !orderId) {
            return NextResponse.json({ error: 'Missing transactionId or orderId parameter' }, { status: 400 });
        }

        const mid = process.env.ROCKYPAYZ_MID?.trim();
        const apiKey = process.env.ROCKYPAYZ_API_KEY?.trim();

        if (!mid || !apiKey) {
            return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
        }

        // Resolve transaction ID
        let clientTxnId = transactionId;

        if (!clientTxnId && orderId) {
            const { data: orderData } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();
            if (orderData) {
                clientTxnId = orderData.payment_id;
            }
        }

        if (!clientTxnId) {
            return NextResponse.json({ error: 'Transaction ID not found' }, { status: 404 });
        }

        const payloadData = {
            mid: mid,
            apikey: apiKey,
            route: 2,
            client_txn_id: clientTxnId,
        };

        const response = await fetch(ROCKYPAYZ_STATUS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payloadData),
        });

        const data = await response.json();

        if (data.status === true && data.data) {
            const txnStatus = data.data.status;
            
            const { data: orderData } = await supabaseAdmin.from('orders').select('*').eq('payment_id', clientTxnId).single();
            
            if (orderData) {
                const oid = orderData.id;
                if (orderData.payment_status !== 'paid' && txnStatus === 'Success') {
                     await supabaseAdmin.from('orders').update({
                        payment_status: 'paid',
                        status: 'processing'
                    }).eq('id', oid);
                } else if (orderData.payment_status === 'pending' && txnStatus === 'Failed') {
                     await supabaseAdmin.from('orders').update({
                        payment_status: 'failed'
                    }).eq('id', oid);
                }
            }
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('RockyPayz Check Status API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
