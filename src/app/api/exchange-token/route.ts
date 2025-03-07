// pages/api/exchange-token.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export const runtime = 'edge';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state } = req.body;

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
      code_verifier: localStorage.getItem('code_verifier') || '', // Retrieve from client-side storage
    }).toString(),
  });

  if (!tokenResponse.ok) {
    return res.status(400).json({ error: 'Failed to exchange code for token' });
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Fetch the user’s X.com profile
  const userResponse = await fetch('https://api.x.com/2/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userResponse.ok) {
    return res.status(400).json({ error: 'Failed to fetch user data' });
  }

  const userData = await userResponse.json();
  const xHandle = userData.data.username;

  // Verify the handle matches the game’s developer handle
  const gameDeveloperHandle = 'expected_handle'; // Replace with logic to fetch the game’s developer handle
  if (xHandle !== gameDeveloperHandle) {
    return res.status(403).json({ error: 'Unauthorized: Handle does not match game developer' });
  }

  // Success: Return the access token to the client
  res.status(200).json({ success: true, access_token: accessToken });
}