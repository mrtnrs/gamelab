// import { NextResponse } from 'next/server';
// import { createClient } from '@supabase/supabase-js';

// export const runtime = 'edge';
// // Create a Supabase client with the service role key (server-side only)
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
//   auth: {
//     autoRefreshToken: false,
//     persistSession: false
//   }
// });

// export async function GET(request: Request) {
//   try {
//     // Get the limit from the query string
//     const url = new URL(request.url);
//     const limit = url.searchParams.get('limit') || '5';
    
//     // Fetch submissions from the database
//     const { data, error } = await adminClient
//       .from('game_submissions')
//       .select('*')
//       .order('submitted_at', { ascending: false })
//       .limit(parseInt(limit));
    
//     if (error) {
//       console.error('Error fetching game submissions:', error);
//       return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
//     }
    
//     return NextResponse.json({ submissions: data });
//   } catch (error) {
//     console.error('Error in submissions API:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }
