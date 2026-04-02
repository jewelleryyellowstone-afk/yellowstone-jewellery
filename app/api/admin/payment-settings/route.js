import { NextResponse } from 'next/server';
import { invalidatePaymentSettingsCache } from '@/lib/payment/settings';

export const dynamic = 'force-dynamic';



export async function POST(request) {
    try {
        // Just invalidate the backend memory cache since frontend saved successfully
        invalidatePaymentSettingsCache();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
