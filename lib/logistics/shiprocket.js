/**
 * Shiprocket API Integration
 * Documentation: https://apidocs.shiprocket.in/
 */

const SHIPROCKET_API_URL = process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1/external';

let authToken = null;
let tokenExpiry = null;

/**
 * Authenticate with Shiprocket and get access token
 */
async function authenticate(credentials = {}) {
    // Use cached token if not expired
    if (authToken && tokenExpiry && Date.now() < tokenExpiry) {
        return authToken;
    }

    const email = credentials.email || process.env.SHIPROCKET_EMAIL;
    const password = credentials.password || process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
        throw new Error('Shiprocket credentials missing. Please configure in Admin Settings.');
    }

    try {
        const response = await fetch(`${SHIPROCKET_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Authentication failed');
        }

        authToken = data.token;
        tokenExpiry = Date.now() + (10 * 60 * 60 * 1000); // 10 hours

        return authToken;
    } catch (error) {
        console.error('Shiprocket authentication error:', error);
        throw error;
    }
}

/**
 * Check pincode serviceability
 */
export async function checkPincodeServiceability(pincode, cod = false, credentials = {}) {
    try {
        const token = await authenticate(credentials);

        const response = await fetch(
            `${SHIPROCKET_API_URL}/courier/serviceability/?pickup_postcode=302001&delivery_postcode=${pincode}&cod=${cod ? 1 : 0}&weight=0.5`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return {
                serviceable: false,
                error: data.message || 'Serviceability check failed',
            };
        }

        return {
            serviceable: data.data?.available_courier_companies?.length > 0,
            couriers: data.data?.available_courier_companies || [],
            estimatedDays: data.data?.available_courier_companies?.[0]?.etd || 'N/A',
        };
    } catch (error) {
        console.error('Pincode check error:', error);
        return {
            serviceable: false,
            error: error.message,
        };
    }
}

/**
 * Create shipment order
 */
export async function createShipment(orderData, credentials = {}) {
    try {
        const token = await authenticate(credentials);

        const shipmentData = {
            order_id: orderData.orderId,
            order_date: new Date().toISOString().split('T')[0],
            pickup_location: 'Primary',
            billing_customer_name: orderData.customerName,
            billing_last_name: '',
            billing_address: orderData.address,
            billing_city: orderData.city,
            billing_pincode: orderData.pincode,
            billing_state: orderData.state,
            billing_country: 'India',
            billing_email: orderData.email,
            billing_phone: orderData.phone,
            shipping_is_billing: true,
            order_items: orderData.items.map(item => ({
                name: item.name,
                sku: item.id,
                units: item.quantity,
                selling_price: item.price,
            })),
            payment_method: orderData.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
            sub_total: orderData.subtotal,
            length: 10,
            breadth: 10,
            height: 5,
            weight: 0.5,
        };

        const response = await fetch(`${SHIPROCKET_API_URL}/orders/create/adhoc`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(shipmentData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Shipment creation failed');
        }

        return {
            success: true,
            shipmentId: data.shipment_id,
            orderId: data.order_id,
            awbCode: data.awb_code,
        };
    } catch (error) {
        console.error('Shipment creation error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Track shipment
 */
export async function trackShipment(awbCode, credentials = {}) {
    try {
        const token = await authenticate(credentials);

        const response = await fetch(
            `${SHIPROCKET_API_URL}/courier/track/awb/${awbCode}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Tracking failed');
        }

        return {
            success: true,
            trackingData: data.tracking_data,
            currentStatus: data.tracking_data?.current_status,
            shipmentTrack: data.tracking_data?.shipment_track || [],
        };
    } catch (error) {
        console.error('Tracking error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Generate AWB (Air Waybill) code
 */
export async function generateAwb(shipmentId, courierId, credentials = {}) {
    try {
        const token = await authenticate(credentials);

        const response = await fetch(`${SHIPROCKET_API_URL}/courier/assign/awb`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                shipment_id: shipmentId,
                courier_id: courierId,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'AWB generation failed');
        }

        return {
            success: true,
            awbCode: data.response?.data?.awb_code,
        };
    } catch (error) {
        console.error('AWB generation error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Cancel shipment
 */
export async function cancelShipment(awbCodes, credentials = {}) {
    try {
        const token = await authenticate(credentials);

        const response = await fetch(`${SHIPROCKET_API_URL}/orders/cancel/shipment/awbs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ awbs: Array.isArray(awbCodes) ? awbCodes : [awbCodes] }),
        });

        const data = await response.json();

        return {
            success: response.ok,
            message: data.message,
        };
    } catch (error) {
        console.error('Shipment cancellation error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}
