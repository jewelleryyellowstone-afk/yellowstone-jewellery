import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendNotification } from '@/lib/notifications/service';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
    try {
        const body = await request.json();
        const signature = request.headers.get('x-shiprocket-signature');

        // Optional: Verify Signature if Shiprocket provides a secret key mechanism
        // For now, relies on the hidden nature of the URL or custom header token if set
        // const expectedSignature = crypto.createHmac('sha256', process.env.SHIPROCKET_WEBHOOK_SECRET)...

        // Log incoming webhook for debugging
        console.log('Shiprocket Webhook:', JSON.stringify(body, null, 2));

        const { awb, current_status, order_id } = body;

        if (!awb || !current_status) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Map Shiprocket Status to App Status
        let newStatus = null;
        if (current_status === 'DELIVERED') {
            newStatus = 'delivered';
        } else if (current_status === 'RTO INITIATED') {
            newStatus = 'cancelled'; // Or specific 'returned' status
        }

        if (newStatus) {
            // Find Order by AWB or Order ID
            // Shiprocket sends 'order_id' which usually matches our DB ID if passed correctly

            let orderDoc;

            // Try fetching by ID first
            if (order_id) {
                const { data } = await supabaseAdmin.from('orders').select('*').eq('id', order_id).single();
                if (data) orderDoc = data;
            }

            // Fallback: Query by AWB in JSONB logistics column
            if (!orderDoc) {
                const { data } = await supabaseAdmin
                    .from('orders')
                    .select('*')
                    .contains('logistics', { awbCode: awb })
                    .limit(1);

                if (data && data.length > 0) {
                    orderDoc = data[0];
                }
            }

            if (orderDoc) {
                const currentLogistics = orderDoc.logistics || {};
                
                // Update Order Status
                await supabaseAdmin.from('orders').update({
                    status: newStatus,
                    logistics: {
                        ...currentLogistics,
                        current_status: current_status
                    }
                }).eq('id', orderDoc.id);

                // Trigger Notification
                await sendNotification(`order_${newStatus}`, orderDoc);

                console.log(`Webhook: Order ${orderDoc.id} updated to ${newStatus}`);
            } else {
                console.warn(`Webhook: Order not found for AWB ${awb}`);
            }
        }

        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error('Shiprocket Webhook Error:', error);
        return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
    }
}
