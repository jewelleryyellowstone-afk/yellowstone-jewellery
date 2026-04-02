
/**
 * Notification Service
 * Handles sending Email and WhatsApp notifications
 */

// Placeholder for Email Service (e.g., SendGrid, Nodemailer)
const sendEmail = async (to, subject, html) => {
    console.log(`[Email Mock] To: ${to}, Subject: ${subject}`);
    // console.log(`[Email Body]:`, html);
    return true;
};

// Placeholder for WhatsApp Service (e.g., Twilio, Interakt)
const sendWhatsApp = async (phone, templateName, variables) => {
    console.log(`[WhatsApp Mock] To: ${phone}, Template: ${templateName}, Vars:`, variables);
    return true;
};

export const sendNotification = async (type, order) => {
    try {
        const { customerName, email, phone, id, subtotal, logistics } = order;
        const orderId = id.slice(0, 8).toUpperCase();
        const trackingLink = logistics?.awbCode ? `https://shiprocket.co/tracking/${logistics.awbCode}` : '#';

        // 1. Order Placed
        if (type === 'order_placed') {
            await sendEmail(
                email,
                `Order Confirmation #${orderId}`,
                `<h3>Hi ${customerName},</h3><p>Your order #${orderId} for ₹${subtotal} has been placed successfully.</p>`
            );
            await sendWhatsApp(phone, 'order_placed', { name: customerName, orderId, amount: subtotal });
        }

        // 2. Order Shipped
        else if (type === 'order_shipped') {
            await sendEmail(
                email,
                `Order #${orderId} Shipped`,
                `<h3>Hi ${customerName},</h3><p>Your order #${orderId} has been shipped! Track here: <a href="${trackingLink}">Track Order</a></p>`
            );
            await sendWhatsApp(phone, 'order_shipped', { name: customerName, orderId, trackingLink });
        }

        // 3. Order Delivered
        else if (type === 'order_delivered') {
            await sendEmail(
                email,
                `Order #${orderId} Delivered`,
                `<h3>Hi ${customerName},</h3><p>Your order #${orderId} has been delivered. Enjoy!</p>`
            );
            await sendWhatsApp(phone, 'order_delivered', { name: customerName, orderId });
        }

        return true;
    } catch (error) {
        console.error('Notification Service Error:', error);
        return false;
    }
};
