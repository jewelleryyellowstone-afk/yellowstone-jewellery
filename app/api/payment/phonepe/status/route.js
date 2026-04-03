import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/server';

// Force dynamic rendering - required
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const transactionId = searchParams.get('transactionId');
        
        if (!transactionId) {
            return NextResponse.json({ error: 'Missing transactionId parameter' }, { status: 400 });
        }

        const isProd = process.env.PHONEPE_ENVIRONMENT?.toLowerCase() === 'production';
        const merchantId = isProd ? process.env.PHONEPE_PROD_CLIENT_ID?.trim() : process.env.PHONEPE_TEST_CLIENT_ID?.trim();
        const saltKey = isProd ? process.env.PHONEPE_PROD_CLIENT_SECRET?.trim() : process.env.PHONEPE_TEST_CLIENT_SECRET?.trim();
        const saltIndex = '1';

        if (!merchantId || !saltKey) {
            return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
        }

        // Standardise orderId from merchantTransactionId
        let orderId = transactionId;
        if (transactionId.includes('_')) {
            orderId = transactionId.split('_')[0];
        }

        const endpoint = `/pg/v1/status/${merchantId}/${transactionId}`; // This is the path part for checksum

        const STATUS_API_BASE_URL = isProd
            ? `https://api.phonepe.com/apis/hermes`
            : `https://api-preprod.phonepe.com/apis/pg-sandbox`;
        const phonePeUrl = `${STATUS_API_BASE_URL}${endpoint}`;

        const stringToSign = endpoint + saltKey;
        const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
        const checksum = sha256 + '###' + saltIndex;

        const response = await fetch(phonePeUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'X-MERCHANT-ID': merchantId
            }
        });

        const data = await response.json();

        if (data.success && data.data) {
            const state = data.data.state;
            
            const { data: orderData } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();
            
            if (orderData) {
                // Keep synchronization only if our internal state is behind
                if (orderData.payment_status !== 'paid' && state === 'COMPLETED') {
                     await supabaseAdmin.from('orders').update({
                        payment_status: 'paid',
                        status: 'processing'
                    }).eq('id', orderId);
                } else if (orderData.payment_status === 'pending' && state === 'FAILED') {
                     await supabaseAdmin.from('orders').update({
                        payment_status: 'failed'
                    }).eq('id', orderId);
                }
            }
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('PhonePe Check Status API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
