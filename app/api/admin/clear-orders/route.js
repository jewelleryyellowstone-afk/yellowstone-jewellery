import { NextResponse } from 'next/server';
import { getDbAdmin, ensureInitialized } from '@/lib/firebase/admin';

export async function POST(request) {
    try {
        await ensureInitialized();
        const db = await getDbAdmin();

        // Warning: This physically deletes all orders. Protect this endpoint in production!
        // Future improvement: check Firebase Auth token server-side for internal Admin access
        
        const { confirm } = await request.json();
        
        if (confirm !== 'WIPE_ALL_DATA') {
            return NextResponse.json({ error: 'Invalid confirmation phrase.' }, { status: 400 });
        }

        const ordersRef = db.collection('orders');
        const snapshot = await ordersRef.get();

        if (snapshot.empty) {
            return NextResponse.json({ message: 'No orders found to delete.' });
        }

        const batch = db.batch();
        let count = 0;

        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
            count++;
        });

        await batch.commit();

        return NextResponse.json({ message: `Successfully deleted ${count} test orders and reset revenue.` });

    } catch (error) {
        console.error('Error clearing test orders:', error);
        return NextResponse.json({ error: error.message || 'Failed to clear orders' }, { status: 500 });
    }
}
