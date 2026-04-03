import { NextResponse } from 'next/server';
import { sendNotification } from '@/lib/notifications/service';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
    try {
        const { orderId, type } = await request.json();

        if (!orderId || !type) {
            return NextResponse.json({ error: 'Missing orderId or type' }, { status: 400 });
        }

        // Fetch order details securely using Supabase
        const { data: order } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Send Notification
        await sendNotification(type, order);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Notification API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send notification' },
            { status: 500 }
        );
    }
}
