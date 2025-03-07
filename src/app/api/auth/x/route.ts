import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    return NextResponse.redirect('https://twitter.com');
  } catch (error) {
    console.error('X auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}