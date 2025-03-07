import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  // Ensure the request method is POST
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Parse the request body
  const body = await request.json();
  const { code, state, code_verifier } = body;

  // In a production app, verify the state parameter against a stored value

  // Exchange code for access token
  const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      code: code as string,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
      code_verifier: code_verifier || '', // Expect code_verifier to be sent from the client
    }).toString(),
  });

  if (!tokenResponse.ok) {
    return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 400 });
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Fetch the user’s X.com profile
  const userResponse = await fetch('https://api.x.com/2/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userResponse.ok) {
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 400 });
  }

  const userData = await userResponse.json();
  const xHandle = userData.data.username;

  // Verify the handle matches the game’s developer handle
  const gameDeveloperHandle = 'expected_handle'; // Replace with actual logic to fetch the game’s developer handle
  if (xHandle !== gameDeveloperHandle) {
    return NextResponse.json({ error: 'Unauthorized: Handle does not match game developer' }, { status: 403 });
  }

  // Success: Return the access token to the client
  return NextResponse.json({ success: true, access_token: accessToken }, { status: 200 });
}