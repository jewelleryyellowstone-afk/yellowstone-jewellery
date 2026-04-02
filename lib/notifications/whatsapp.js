/**
 * WhatsApp Notification Helpers
 * Uses WhatsApp Business API or direct link method
 */

/**
 * Create WhatsApp URL for sending messages
 */
function createWhatsAppUrl(phone, message) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Send order confirmation message
 */
export function sendOrderConfirmation(orderData) {
    const message = `🎉 *Order Confirmed!*

Hi ${orderData.customerName},

Thank you for your order!

*Order ID:* ${orderData.orderId.slice(0, 8).toUpperCase()}
*Amount:* ₹${orderData.amount}
*Items:* ${orderData.itemCount} item(s)

*Delivery Address:*
${orderData.address}
${orderData.city}, ${orderData.state} - ${orderData.pincode}

*Payment:* ${orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (Paid)'}

We'll notify you once your order is shipped.

Track your order: ${process.env.NEXT_PUBLIC_SITE_URL}/account/orders/${orderData.orderId}

*YellowStone Jewellery*
For support: ${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`;

    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    const url = createWhatsAppUrl(orderData.phone, message);

    // In a real implementation, you would use WhatsApp Business API
    // For now, we log the message
    console.log('Order confirmation message:', message);
    console.log('WhatsApp URL:', url);

    return {
        success: true,
        message,
        url,
    };
}

/**
 * Send order shipped notification
 */
export function sendShippedNotification(orderData) {
    const message = `📦 *Order Shipped!*

Hi ${orderData.customerName},

Great news! Your order has been shipped.

*Order ID:* ${orderData.orderId.slice(0, 8).toUpperCase()}
*Tracking ID:* ${orderData.awbCode || 'Will be updated soon'}
*Courier:* ${orderData.courierName || 'Standard Delivery'}
*Expected Delivery:* ${orderData.estimatedDelivery || '3-5 business days'}

*Delivery Address:*
${orderData.address}
${orderData.city}, ${orderData.state} - ${orderData.pincode}

Track your order: ${process.env.NEXT_PUBLIC_SITE_URL}/account/orders/${orderData.orderId}

*YellowStone Jewellery*`;

    const url = createWhatsAppUrl(orderData.phone, message);

    console.log('Shipped notification:', message);

    return {
        success: true,
        message,
        url,
    };
}

/**
 * Send order delivered notification
 */
export function sendDeliveredNotification(orderData) {
    const message = `✅ *Order Delivered!*

Hi ${orderData.customerName},

Your order has been successfully delivered!

*Order ID:* ${orderData.orderId.slice(0, 8).toUpperCase()}

We hope you love your new jewellery! ✨

Please rate your experience and share a review.

Need help? Contact us anytime.

Thank you for choosing *YellowStone Jewellery* 💛`;

    const url = createWhatsAppUrl(orderData.phone, message);

    console.log('Delivered notification:', message);

    return {
        success: true,
        message,
        url,
    };
}

/**
 * Send order cancelled notification
 */
export function sendCancelledNotification(orderData) {
    const message = `❌ *Order Cancelled*

Hi ${orderData.customerName},

Your order has been cancelled as requested.

*Order ID:* ${orderData.orderId.slice(0, 8).toUpperCase()}
*Reason:* ${orderData.cancelReason || 'Requested by customer'}

${orderData.refundAmount ? `*Refund Amount:* ₹${orderData.refundAmount}\n*Refund will be processed in 5-7 business days.*` : ''}

If you have any questions, please contact us.

*YellowStone Jewellery*`;

    const url = createWhatsAppUrl(orderData.phone, message);

    console.log('Cancelled notification:', message);

    return {
        success: true,
        message,
        url,
    };
}

/**
 * Send payment success notification
 */
export function sendPaymentSuccessNotification(orderData) {
    const message = `💳 *Payment Successful!*

Hi ${orderData.customerName},

Your payment has been received successfully.

*Order ID:* ${orderData.orderId.slice(0, 8).toUpperCase()}
*Amount Paid:* ₹${orderData.amount}
*Payment ID:* ${orderData.transactionId}

Your order is being processed and will be shipped soon.

Thank you for shopping with us!

*YellowStone Jewellery*`;

    const url = createWhatsAppUrl(orderData.phone, message);

    console.log('Payment success notification:', message);

    return {
        success: true,
        message,
        url,
    };
}

/**
 * Batch send notifications
 * In production, integrate with WhatsApp Business API
 */
export async function sendNotification(type, orderData) {
    switch (type) {
        case 'order_confirmed':
            return sendOrderConfirmation(orderData);
        case 'order_shipped':
            return sendShippedNotification(orderData);
        case 'order_delivered':
            return sendDeliveredNotification(orderData);
        case 'order_cancelled':
            return sendCancelledNotification(orderData);
        case 'payment_success':
            return sendPaymentSuccessNotification(orderData);
        default:
            return { success: false, error: 'Invalid notification type' };
    }
}
