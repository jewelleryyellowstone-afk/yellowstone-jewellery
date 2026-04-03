import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
    try {
        // Warning: This physically deletes all orders. Protect this endpoint in production!
        // Future improvement: check Firebase Auth token server-side for internal Admin access
        
        const { confirm } = await request.json();
        
        if (confirm !== 'WIPE_ALL_DATA') {
            return NextResponse.json({ error: 'Invalid confirmation phrase.' }, { status: 400 });
        }

        const { data: orders } = await supabaseAdmin.from('orders').select('id');

        if (!orders || orders.length === 0) {
            return NextResponse.json({ message: 'No orders found to delete.' });
        }

        const ids = orders.map(order => order.id);
        const { error } = await supabaseAdmin.from('orders').delete().in('id', ids);

        if (error) {
            throw error;
        }

        return NextResponse.json({ message: `Successfully deleted ${ids.length} test orders and reset revenue.` });

    } catch (error) {
        console.error('Error clearing test orders:', error);
        return NextResponse.json({ error: error.message || 'Failed to clear orders' }, { status: 500 });
    }
}
