import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map(d => ({
            id: d.id,
            email: d.data().email,
            isAdmin: d.data().isAdmin,
            ...d.data()
        }));

        return NextResponse.json({
            count: users.length,
            users: users
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
