# YellowStone Jewellery - Logistics & Notifications Setup

## Shiprocket Integration

### 1. Create Shiprocket Account

1. Sign up at [Shiprocket](https://www.shiprocket.in/)
2. Complete KYC verification
3. Add pickup addresses

### 2. Get API Credentials

1. Go to Settings → API
2. Copy your email and generate password
3. Note the API URL: `https://apiv2.shiprocket.in/v1/external`

### 3. Environment Variables

Add to `.env.local`:

```env
# Shiprocket Credentials
SHIPROCKET_EMAIL=your_email@example.com
SHIPROCKET_PASSWORD=your_api_password
SHIPROCKET_API_URL=https://apiv2.shiprocket.in/v1/external
```

## Features Implemented

### 1. Pincode Serviceability Check
**Endpoint**: `/api/logistics/check-pincode?pincode=110001&cod=false`

```javascript
// Returns:
{
  serviceable: true,
  couriers: [...],
  estimatedDays: "3-4"
}
```

### 2. Create Shipment
**Endpoint**: `/api/logistics/create-shipment`

```javascript
POST /api/logistics/create-shipment
Body: { orderId: "firestore_order_id" }

// Returns:
{
  success: true,
  shipmentId: 12345,
  awbCode: "AWB1234567890"
}
```

### 3. Track Shipment
Use the tracking function in `lib/logistics/shiprocket.js`:

```javascript
import { trackShipment } from '@/lib/logistics/shiprocket';

const tracking = await trackShipment('AWB1234567890');
```

## WhatsApp Notifications

### Setup

Update `.env.local`:

```env
# WhatsApp Configuration
NEXT_PUBLIC_WHATSAPP_NUMBER=919876543210
NEXT_PUBLIC_SITE_URL=https://yellowstonejewellery.com
```

### Notification Types

1. **Order Confirmation** - Sent when order is placed
2. **Payment Success** - Sent when online payment succeeds
3. **Order Shipped** - Sent when shipment is created
4. **Order Delivered** - Sent when delivery is confirmed
5. **Order Cancelled** - Sent if order is cancelled

### Usage

```javascript
import { sendNotification } from '@/lib/notifications/whatsapp';

await sendNotification('order_confirmed', {
  orderId: order.id,
  customerName: order.customerName,
  phone: order.phone,
  amount: order.subtotal,
  itemCount: order.items.length,
  address: order.shippingAddress.address,
  city: order.shippingAddress.city,
  state: order.shippingAddress.state,
  pincode: order.shippingAddress.pincode,
  paymentMethod: order.paymentMethod,
});
```

## Workflow

### Order to Delivery Flow

```
1. Customer places order
   ↓
2. Order created in Firestore (status: pending)
   ↓
3. Payment processed (Razorpay/COD)
   ↓
4. WhatsApp: Order Confirmation sent
   ↓
5. Admin packs order (status: packed)
   ↓
6. Create Shiprocket shipment via API
   ↓
7. AWB code generated
   ↓
8. Order updated (status: shipped, awbCode saved)
   ↓
9. WhatsApp: Shipment notification sent
   ↓
10. Shiprocket webhook updates delivery status
    ↓
11. Order updated (status: delivered)
    ↓
12. WhatsApp: Delivery confirmation sent
```

## Admin Actions

### Ship Order

```javascript
// In admin order detail page
const handleShipOrder = async () => {
  const response = await fetch('/api/logistics/create-shipment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: order.id }),
  });

  const data = await response.json();
  
  if (data.success) {
    alert(`Shipment created! AWB: ${data.awbCode}`);
  }
};
```

## Testing

### Test Pincodes
- **Serviceable**: 110001, 400001, 560001
- **Non-serviceable**: 000000

### Test Flow
1. Create test order with COD
2. Admin → Orders → Click order
3. Update status to "Packed"
4. Click "Create Shipment"
5. Verify AWB code is generated
6. Check WhatsApp notification log

## Production Checklist

- [ ] Shiprocket account verified
- [ ] Pickup addresses configured
- [ ] API credentials added
- [ ] Test shipment created successfully
- [ ] WhatsApp Business API integrated (optional)
- [ ] Webhook configured for tracking updates
- [ ] Notification templates finalized
- [ ] Test complete order flow

## Webhook Setup (Shiprocket)

### 1. Create Webhook Endpoint

```javascript
// app/api/webhooks/shiprocket/route.js
export async function POST(request) {
  const event = await request.json();
  
  // Update order status based on Shiprocket event
  if (event.current_status === 'DELIVERED') {
    await updateDocument('orders', orderId, {
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
    });
    
    // Send delivery notification
    await sendNotification('order_delivered', orderData);
  }
}
```

### 2. Configure in Shiprocket

1. Go to Settings → Webhooks
2. Add URL: `https://yourdomain.com/api/webhooks/shiprocket`
3. Select events: Order status updates
4. Save

## Advanced Features

### Bulk Shipment Labels
```javascript
import { generateAwb } from '@/lib/logistics/shiprocket';

const awb = await generateAwb(shipmentId, courierId);
```

### Cancel Shipment
```javascript
import { cancelShipment } from '@/lib/logistics/shiprocket';

await cancelShipment(['AWB123', 'AWB456']);
```

## Troubleshooting

### Shipment Creation Fails
- Verify pickup location is configured
- Check product weight/dimensions
- Ensure pincode is serviceable
- Validate customer address format

### Authentication Errors
- Verify email/password
- Check API URL is correct
- Token may have expired (auto-refreshes)

### Tracking Not Working
- AWB code must be valid
- Shipment might not be picked up yet
- Check Shiprocket dashboard

## Support

- Shiprocket Docs: https://apidocs.shiprocket.in/
- WhatsApp Business API: https://business.whatsapp.com/
- Support: support@shiprocket.in
