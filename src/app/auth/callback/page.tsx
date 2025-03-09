'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { processCallback } from '@/actions/auth-actions';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Processing authentication...');
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<{
    cookies: string;
    url: string;
    params: Record<string, string>;
  }>({
    cookies: '',
    url: '',
    params: {},
  });

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get URL parameters
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Collect debug information
        const url = window.location.href;
        const cookiesStr = document.cookie;
        const params: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          params[key] = value;
        });

        setDebugInfo({
          cookies: cookiesStr,
          url,
          params,
        });

        // Handle Twitter OAuth error
        if (error) {
          setStatus('error');
          setMessage(`X.com authentication error: ${error}`);
          setErrorDetails({
            error,
            errorDescription,
            timestamp: new Date().toISOString()
          });
          setErrorType('oauth_error');
          return;
        }

        // Validate required parameters
        if (!code || !state) {
          setStatus('error');
          setMessage('Missing required parameters for authentication.');
          setErrorDetails({
            missingCode: !code,
            missingState: !state,
            timestamp: new Date().toISOString()
          });
          setErrorType('missing_parameters');
          return;
        }

        // Process the callback
        const result = await processCallback(code, state);

        if (result.error) {
          setStatus('error');
          setMessage(result.error);
          setErrorDetails(result.errorDetails || null);
          setErrorType(result.errorType || 'unknown_error');
        } else if (result.redirect) {
          // Successful authentication, redirect
          router.push(result.redirect);
        } else {
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
        setErrorDetails({
          error: String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        setErrorType('callback_exception');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">X.com Authentication</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {status === 'loading'
              ? 'Processing your authentication...'
              : status === 'success'
              ? 'Authentication successful!'
              : 'Authentication failed'}
          </p>
          
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="h-8 w-8 text-green-500">✓</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">⚠️</div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Authentication Error</h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">{message}</div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => router.push('/')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
                >
                  ← Return to Home
                </button>
              </div>

              <hr className="my-4 border-gray-200 dark:border-gray-700" />

              <div className="w-full">
                <details className="mb-2">
                  <summary className="cursor-pointer p-2 bg-gray-50 dark:bg-gray-700 rounded-md">Error Details</summary>
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-md mt-1">
                    <div className="text-sm space-y-2">
                      <p><strong>Error Type:</strong> {errorType || 'Unknown'}</p>
                      {errorDetails && (
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-auto max-h-60">
                          <pre className="text-xs whitespace-pre-wrap">
                            {JSON.stringify(errorDetails, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </details>

                <details>
                  <summary className="cursor-pointer p-2 bg-gray-50 dark:bg-gray-700 rounded-md">Debug Information</summary>
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-md mt-1">
                    <div className="text-sm space-y-2">
                      <p><strong>URL:</strong></p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-auto max-h-40">
                        <pre className="text-xs whitespace-pre-wrap break-all">{debugInfo.url}</pre>
                      </div>

                      <p><strong>Parameters:</strong></p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-auto max-h-40">
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(debugInfo.params, null, 2)}
                        </pre>
                      </div>

                      <p><strong>Cookies:</strong></p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-auto max-h-40">
                        <pre className="text-xs whitespace-pre-wrap break-all">{debugInfo.cookies}</pre>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}