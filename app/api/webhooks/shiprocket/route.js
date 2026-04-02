
import { NextResponse } from 'next/server';
import { getDbAdmin, ensureInitialized } from '@/lib/firebase/admin';
import { sendNotification } from '@/lib/notifications/service';
import crypto from 'crypto';

export async function POST(request) {
    try {
        await ensureInitialized();
        const db = await getDbAdmin();

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
            // Shiprocket sends 'order_id' which usually matches our Firestore ID if passed correctly
            // Alternatively, query by logistics.awbCode

            let orderRef;
            let orderDoc;

            // Try fetching by ID first
            if (order_id) {
                orderDoc = await db.collection('orders').doc(order_id).get();
            }

            // Fallback: Query by AWB
            if (!orderDoc?.exists) {
                const querySnapshot = await db.collection('orders')
                    .where('logistics.awbCode', '==', awb)
                    .limit(1)
                    .get();

                if (!querySnapshot.empty) {
                    orderDoc = querySnapshot.docs[0];
                    orderRef = orderDoc.ref;
                }
            } else {
                orderRef = orderDoc.ref;
            }

            if (orderDoc?.exists) {
                // Update Order Status
                await orderRef.update({
                    status: newStatus,
                    'logistics.currentStatus': current_status,
                    updatedAt: new Date().toISOString()
                });

                // Trigger Notification
                const orderData = { id: orderDoc.id, ...orderDoc.data() };
                await sendNotification(`order_${newStatus}`, orderData);

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
