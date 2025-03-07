import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  // Extract the access token from the Authorization header
  const authorizationHeader = request.headers.get('authorization');
  const accessToken = authorizationHeader?.split(' ')[1];

  // Check if the access token is missing
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the token by fetching user data from the X API
  const userResponse = await fetch('https://api.x.com/2/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // Check if the token is invalid
  if (!userResponse.ok) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Extract the user's handle from the response
  const userData = await userResponse.json();
  const xHandle = userData.data.username;
  const gameDeveloperHandle = 'expected_handle'; // Replace with actual logic

  // Verify the handle matches the expected game developer handle
  if (xHandle !== gameDeveloperHandle) {
    return NextResponse.json({ error: 'Unauthorized: Handle mismatch' }, { status: 403 });
  }

  // Proceed with adding the log (e.g., save to database)
  return NextResponse.json({ success: true }, { status: 200 });
}