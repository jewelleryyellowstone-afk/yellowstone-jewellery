import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyAdminRequest } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
    try {
        // Authenticate Admin
        const isAdmin = await verifyAdminRequest(request);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, courierName, trackingNumber, trackingUrl } = body;

        if (!orderId || !courierName || !trackingNumber) {
            return NextResponse.json({ error: 'Order ID, Courier Name and Tracking Number are required' }, { status: 400 });
        }

        // 2. Fetch Order from Supabase
        const { data: orderSnap } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();

        if (!orderSnap) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // 3. Update Order in Supabase
        const shippedAt = new Date().toISOString();
        const shipmentData = {
            provider: 'Manual',
            courierName,
            awbCode: trackingNumber,
            trackingUrl: trackingUrl || '',
            shipmentId: `MANUAL-${Date.now()}`,
            shippedAt
        };

        await supabaseAdmin.from('orders').update({
            status: 'shipped',
            logistics: shipmentData
        }).eq('id', orderId);

        // 4. Trigger Notification
        try {
            // We can reuse the notification logic or let the frontend trigger it.
            // But since we are here, we might as well do it if the notification API supports it.
            // For now, let's stick to the pattern of frontend triggering it or separate service.
            // The previous frontend code triggered notification *after* status update. 
            // The API logic doesn't strictly need to trigger it unless we move that logic here.
            // Let's keep it simple and return success.
        } catch (err) {
            console.error('Notification error', err);
        }

        return NextResponse.json({
            success: true,
            data: shipmentData
        });

    } catch (error) {
        console.error('Shipment API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
