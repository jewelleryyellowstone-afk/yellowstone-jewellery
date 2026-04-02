import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDbAdmin, ensureInitialized } from '@/lib/firebase/admin';
import { getPaymentSettings } from '@/lib/payment/settings';

export async function POST(request) {
    try {
        await ensureInitialized();
        const db = await getDbAdmin();

        const payload = await request.json();
        
        // PhonePe payload must have "response" root key
        if (!payload.response) {
            console.error("PhonePe Webhook Error: No response object");
            // Always return 200 OK so PhonePe doesn't retry indefinitely for a bad format
            return NextResponse.json({ success: true }, { status: 200 });
        }

        const settings = await getPaymentSettings();
        if (!settings?.saltKey || !settings?.saltIndex) {
            console.error('PhonePe Webhook Error: PhonePe keys not configured');
            return NextResponse.json({ success: false, message: 'Configuration error' }, { status: 500 });
        }

        const { saltKey, saltIndex } = settings;

        // X-VERIFY Validation
        const receivedChecksum = request.headers.get('x-verify');
        const generatedChecksum = crypto.createHash('sha256').update(payload.response + saltKey).digest('hex') + '###' + saltIndex;

        if (!receivedChecksum || receivedChecksum !== generatedChecksum) {
            console.error('PhonePe Webhook Error: Invalid signature / X-VERIFY mismatch');
            return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
        }

        // Decode Base64 Payload
        const decodedString = Buffer.from(payload.response, 'base64').toString('utf8');
        const eventBody = JSON.parse(decodedString);

        if (!eventBody || !eventBody.data) {
             return NextResponse.json({ success: true }, { status: 200 }); // Fast ACK if missing data
        }

        const state = eventBody.code;
        const merchantTransactionId = eventBody.data.merchantTransactionId;
        
        if (!merchantTransactionId) {
            return NextResponse.json({ success: true }, { status: 200 });
        }

        let orderId = merchantTransactionId;
        if (merchantTransactionId.includes('_')) {
             orderId = merchantTransactionId.split('_')[0];
        }

        // Idempotency check: verify current status first
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            console.warn(`PhonePe Webhook Warning: Order ${orderId} not found`);
            return NextResponse.json({ success: true, message: 'Order not found' }, { status: 200 });
        }
        const orderData = orderDoc.data();
        if (orderData.paymentStatus === 'paid') {
            // Idempotent return - already processed successfully
            console.log(`PhonePe Webhook: Order ${orderId} already paid`);
            return NextResponse.json({ success: true, message: 'Already processed' }, { status: 200 });
        }

        let paymentStatus = '';
        let orderStatus = '';

        if (state === 'PAYMENT_SUCCESS') {
            paymentStatus = 'paid';
            orderStatus = 'processing';
        } else if (state === 'PAYMENT_ERROR') {
            paymentStatus = 'failed';
        }

        // Update database if state changed
        if (paymentStatus) {
            const updates = {
                paymentStatus,
                updatedAt: new Date().toISOString()
            };
            if (orderStatus) updates.status = orderStatus;

            await db.collection('orders').doc(orderId).update(updates);
            
            // Trigger confirmation notification system securely if PAID
            if (paymentStatus === 'paid') {
                const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || new URL(request.url).origin || 'http://localhost:3000';
                fetch(`${baseUrl}/api/notifications`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId, type: 'order_placed' }),
                }).catch(e => console.error("Notification trigger fail via Webhook", e));
            }
        }

        return NextResponse.json({ success: true, message: 'Webhook processed successfully' }, { status: 200 });
    } catch (error) {
        console.error('PhonePe Webhook Catch Block Error:', error);
        // Return 200 to acknowledge receipt even on internal unhandled error,
        // although 500 is technically correct, PhonePe will keep retrying on 500s.
        return NextResponse.json({ success: false, message: 'Handled with error' }, { status: 200 });
    }
}
