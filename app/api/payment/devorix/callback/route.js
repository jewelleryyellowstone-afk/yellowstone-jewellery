import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
    try {
        const body = await request.json();
        console.log('[Devorix Callback] Received:', JSON.stringify(body));

        const { secretkey, MerRefNo, Amount, Status, TxnID, UTRNO, TxnDate } = body;

        const envSecret = process.env.DEVORIX_SECRET_KEY?.trim();

        if (secretkey !== envSecret) {
            console.error('[Devorix Callback] ❌ Invalid Secret Key');
            return NextResponse.json({ statusCode: "failure", message: "Invalid Secret Key" }, { status: 401 });
        }

        if (!MerRefNo) {
            return NextResponse.json({ statusCode: "failure", message: "Missing MerRefNo" }, { status: 400 });
        }

        const orderId = MerRefNo.split('_')[0];

        // Fetch order from Supabase
        const { data: orderDoc } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();
        
        if (!orderDoc) {
            console.error(`[Devorix Callback] ❌ Order not found for MerRefNo: ${MerRefNo}`);
            return NextResponse.json({ statusCode: "failure", message: "Order not found" }, { status: 404 });
        }

        if (orderDoc.payment_status === 'paid') {
            console.log(`[Devorix Callback] Order ${orderId} already paid`);
            return NextResponse.json({
                QpayId: TxnID || "",
                ReferenceNo: MerRefNo,
                PayAmt: Amount,
                PaymentStatus: "SUCCESS",
                ApiTxnID: TxnID || "",
                Bank_UTR_No: UTRNO || "",
                Datetime: TxnDate || new Date().toISOString()
            });
        }

        if (Status?.toUpperCase() === 'SUCCESS') {
            await supabaseAdmin.from('orders').update({
                payment_status: 'paid',
                status: 'processing'
            }).eq('id', orderId);

            // Fire notification non-blocking
            const host = request.headers.get('host') || 'localhost:3000';
            const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
            const baseUrl = `${protocol}://${host}`;
            
            fetch(`${baseUrl}/api/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, type: 'order_placed' }),
            }).catch(e => console.error('[Devorix Callback] Notification failed:', e));

            return NextResponse.json({
                QpayId: TxnID || "",
                ReferenceNo: MerRefNo,
                PayAmt: Amount,
                PaymentStatus: "SUCCESS",
                ApiTxnID: TxnID || "",
                Bank_UTR_No: UTRNO || "",
                Datetime: TxnDate || new Date().toISOString()
            });

        } else if (Status?.toUpperCase() === 'FAILED') {
            await supabaseAdmin.from('orders').update({
                payment_status: 'failed'
            }).eq('id', orderId);

            return NextResponse.json({
                statusCode: "failure",
                message: "TXN Failed",
                pay_id: TxnID || "",
                Bank_UTR_No: UTRNO || ""
            });
        }

        // Pending or unknown
        return NextResponse.json({
            statusCode: "pending",
            message: "TXN Pending"
        });

    } catch (error) {
        console.error('[Devorix Callback] Error:', error);
        return NextResponse.json({ statusCode: "error", message: "Server error" }, { status: 500 });
    }
}
