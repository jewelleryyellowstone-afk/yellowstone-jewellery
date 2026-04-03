import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const { data } = await supabaseAdmin.from('users').select('*').limit(50);
        const users = data || [];

        return NextResponse.json({
            count: users.length,
            users: users
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
