import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const body = await req.json();
        const { orderId, amount, customer_mobile } = body;

        if (!orderId || !amount || !customer_mobile) {
            return NextResponse.json(
                { error: 'Missing required parameters: orderId, amount, customer_mobile' },
                { status: 400 }
            );
        }

        const mid = (process.env.SHAYMAVENUE_MID || '').trim();
        const apikey = (process.env.SHAYMAVENUE_API_KEY || '').trim();

        if (!mid || !apikey) {
            return NextResponse.json(
                { error: 'Shaymavenue Merchant Credentials missing on server' },
                { status: 500 }
            );
        }

        // Clean phone number (ensure 10 digits)
        const cleanMobile = customer_mobile.replace(/\D/g, '').slice(-10);

        const payload = {
            mid,
            apikey,
            client_txn_id: String(orderId),
            amount: Number(amount),
            customer_mobile: cleanMobile || '9999999999',
        };

        const res = await fetch('https://shaymavenue.in/api/v1/create_order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        console.log('Shaymavenue create_order Response:', JSON.stringify(data, null, 2));

        const isFailed = !res.ok ||
                         data.statuscode === false ||
                         data.status === false ||
                         data.status === 'failed' ||
                         data.status === 'Failed' ||
                         data.result === 'failed' ||
                         data.result === 'Failed' ||
                         data.data?.status === 'Failed' ||
                         data.data?.status === 'failed';

        if (isFailed) {
            console.error('Shaymavenue Create Order Failed:', data);
            const errorMsg = data.msg || data.message || data.error || 'Failed to create payment order on Shaymavenue';
            return NextResponse.json(
                { error: errorMsg },
                { status: 400 }
            );
        }

        // Normalize payment redirect URL, intent URL, and QR code from Shaymavenue payload
        const payment_url = data.payment_url || data.payment_link || data.redirect_url || data.checkout_url || data.pay_url || data.url || 
                            data.result?.payment_url || data.result?.payment_link || data.result?.redirect_url || data.result?.url || data.result?.checkout_url || 
                            data.data?.payment_url || data.data?.payment_link || data.data?.redirect_url || data.data?.url;

        const intent = data.intent || data.upi_intent || data.upi_link || 
                       data.result?.intent || data.result?.upi_intent || data.result?.upi_link || 
                       data.data?.intent || data.data?.upi_intent;

        const qr_code = data.qr_code || data.qr || data.result?.qr_code || data.result?.qr || data.data?.qr_code;

        return NextResponse.json({
            ...data,
            payment_url,
            intent,
            qr_code,
        });
    } catch (error) {
        console.error('Shaymavenue Create Order Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
