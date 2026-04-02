import { NextResponse } from 'next/server';
import { checkPincodeServiceability } from '@/lib/logistics/shiprocket';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const pincode = searchParams.get('pincode');
        const cod = searchParams.get('cod') === 'true';

        if (!pincode || pincode.length !== 6) {
            return NextResponse.json(
                { error: 'Invalid pincode' },
                { status: 400 }
            );
        }

        const result = await checkPincodeServiceability(pincode, cod);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Pincode check API error:', error);
        return NextResponse.json(
            { error: error.message || 'Pincode check failed' },
            { status: 500 }
        );
    }
}
