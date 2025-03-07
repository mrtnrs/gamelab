// pages/api/add-log.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export const runtime = 'edge';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const accessToken = req.headers.authorization?.split(' ')[1];
  if (!accessToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify token and user handle (similar to exchange-token.ts)
  const userResponse = await fetch('https://api.x.com/2/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userResponse.ok) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const userData = await userResponse.json();
  const xHandle = userData.data.username;
  const gameDeveloperHandle = 'expected_handle'; // Replace with actual logic

  if (xHandle !== gameDeveloperHandle) {
    return res.status(403).json({ error: 'Unauthorized: Handle mismatch' });
  }

  // Proceed with adding the log (e.g., save to database)
  res.status(200).json({ success: true });
}