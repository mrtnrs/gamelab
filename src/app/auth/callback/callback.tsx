// pages/auth/callback.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const { code, state } = router.query;
    if (code && state) {
      // Send the code to a serverless function for token exchange
      fetch('/api/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Store access token securely (consider HTTP-only cookies for better security)
            localStorage.setItem('access_token', data.access_token);
            router.push('/dashboard'); // Redirect to a protected page
          } else {
            console.error('Authentication failed:', data.error);
          }
        })
        .catch(error => console.error('Error:', error));
    }
  }, [router.query]);

  return <div>Processing authentication...</div>;
}