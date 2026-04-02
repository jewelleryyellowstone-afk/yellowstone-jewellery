
import { NextResponse } from 'next/server';
import { sendNotification } from '@/lib/notifications/service';
import { getDbAdmin, ensureInitialized } from '@/lib/firebase/admin';

export async function POST(request) {
    try {
        await ensureInitialized();
        const db = await getDbAdmin();

        const { orderId, type } = await request.json();

        if (!orderId || !type) {
            return NextResponse.json({ error: 'Missing orderId or type' }, { status: 400 });
        }

        // Fetch order details securely using Admin SDK
        const orderDoc = await db.collection('orders').doc(orderId).get();

        if (!orderDoc.exists) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const order = { id: orderDoc.id, ...orderDoc.data() };

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
