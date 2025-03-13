// app/api/changelogs/update/[id]/route.ts
import { NextResponse } from 'next/server';
import { updateChangelog as serverUpdateChangelog } from '@/actions/server-changelog-actions';

export const runtime = 'edge';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Optionally, check for a secret header here if desired.
    const data = await request.json();
    const result = await serverUpdateChangelog(params.id, data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API update] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error updating changelog' },
      { status: 500 }
    );
  }
}
