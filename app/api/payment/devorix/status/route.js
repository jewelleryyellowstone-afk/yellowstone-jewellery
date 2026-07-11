import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEVORIX_BASE_URL = 'https://api.devorixsolutions.net/api';
const DEVORIX_STATUS_URL = `${DEVORIX_BASE_URL}/PaymentStatus`;

export async function POST(request) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        const { data: orderDoc } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();
        if (!orderDoc) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const clientTxnId = orderDoc.payment_id;

        if (!clientTxnId) {
            return NextResponse.json({ error: 'No transaction ID associated with this order' }, { status: 400 });
        }

        if (orderDoc.payment_status === 'paid') {
            return NextResponse.json({ status: 'SUCCESS', details: orderDoc });
        } else if (orderDoc.payment_status === 'failed') {
            return NextResponse.json({ status: 'FAILED', details: orderDoc });
        }
        
        return NextResponse.json({ status: 'PENDING' });

    } catch (error) {
        console.error('[Devorix Status] Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
