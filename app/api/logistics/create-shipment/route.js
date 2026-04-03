import { NextResponse } from 'next/server';
import { createShipment } from '@/lib/logistics/shiprocket';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendNotification } from '@/lib/notifications/whatsapp';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID required' },
                { status: 400 }
            );
        }

        // Get order details from Supabase
        const { data: order } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Create shipment with Shiprocket
        const shipmentResult = await createShipment({
            orderId: order.id,
            customerName: order.customer_name,
            email: order.email,
            phone: order.phone,
            address: order.shipping_address?.address,
            city: order.shipping_address?.city,
            state: order.shipping_address?.state,
            pincode: order.shipping_address?.pincode,
            items: order.items,
            subtotal: order.subtotal,
            paymentMethod: order.payment_method,
        });

        if (!shipmentResult.success) {
            return NextResponse.json(
                { error: shipmentResult.error },
                { status: 500 }
            );
        }

        // Update order with shipment details in logistics jsonb
        const currentLogistics = order.logistics || {};
        await supabaseAdmin.from('orders').update({
            status: 'shipped',
            logistics: {
                ...currentLogistics,
                shipment_id: shipmentResult.shipmentId,
                awb_code: shipmentResult.awbCode,
                shipped_at: new Date().toISOString()
            }
        }).eq('id', orderId);

        // Send WhatsApp notification
        await sendNotification('order_shipped', {
            orderId: order.id,
            customerName: order.customer_name,
            phone: order.phone,
            awbCode: shipmentResult.awbCode,
            address: order.shipping_address?.address,
            city: order.shipping_address?.city,
            state: order.shipping_address?.state,
            pincode: order.shipping_address?.pincode,
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
