import { NextResponse } from 'next/server';
import { createShipment } from '@/lib/logistics/shiprocket';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { sendNotification } from '@/lib/notifications/whatsapp';

export async function POST(request) {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID required' },
                { status: 400 }
            );
        }

        // Get order details from Firestore
        const { data: order } = await getDocument('orders', orderId);

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Create shipment with Shiprocket
        const shipmentResult = await createShipment({
            orderId: order.id,
            customerName: order.customerName,
            email: order.email,
            phone: order.phone,
            address: order.shippingAddress.address,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            pincode: order.shippingAddress.pincode,
            items: order.items,
            subtotal: order.subtotal,
            paymentMethod: order.paymentMethod,
        });

        if (!shipmentResult.success) {
            return NextResponse.json(
                { error: shipmentResult.error },
                { status: 500 }
            );
        }

        // Update order with shipment details
        await updateDocument('orders', orderId, {
            shipmentId: shipmentResult.shipmentId,
            awbCode: shipmentResult.awbCode,
            status: 'shipped',
            shippedAt: new Date().toISOString(),
        });

        // Send WhatsApp notification
        await sendNotification('order_shipped', {
            orderId: order.id,
            customerName: order.customerName,
            phone: order.phone,
            awbCode: shipmentResult.awbCode,
            address: order.shippingAddress.address,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            pincode: order.shippingAddress.pincode,
        });

        return NextResponse.json({
            success: true,
            shipmentId: shipmentResult.shipmentId,
            awbCode: shipmentResult.awbCode,
        });
    } catch (error) {
        console.error('Shipment creation API error:', error);
        return NextResponse.json(
            { error: error.message || 'Shipment creation failed' },
            { status: 500 }
        );
    }
}
