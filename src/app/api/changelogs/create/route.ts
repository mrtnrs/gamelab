// app/api/changelogs/create/route.ts
import { NextResponse } from 'next/server';
import { createChangelog as serverCreateChangelog } from '@/actions/server-changelog-actions';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    // Optionally, check for a secret header here if desired.
    const data = await request.json();
    const result = await serverCreateChangelog(data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API create] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error creating changelog' },
      { status: 500 }
    );
  }
}
