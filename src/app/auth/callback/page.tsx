'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { processCallback } from '@/actions/auth-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>X.com Authentication</CardTitle>
          <CardDescription>
            {status === 'loading'
              ? 'Processing your authentication...'
              : status === 'success'
              ? 'Authentication successful!'
              : 'Authentication failed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>

              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Return to Home
                </Button>
              </div>

              <Separator className="my-4" />

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="error-details">
                  <AccordionTrigger>Error Details</AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm space-y-2">
                      <p><strong>Error Type:</strong> {errorType || 'Unknown'}</p>
                      {errorDetails && (
                        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md overflow-auto max-h-60">
                          <pre className="text-xs whitespace-pre-wrap">
                            {JSON.stringify(errorDetails, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="debug-info">
                  <AccordionTrigger>Debug Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm space-y-2">
                      <p><strong>URL:</strong></p>
                      <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md overflow-auto max-h-40">
                        <pre className="text-xs whitespace-pre-wrap break-all">{debugInfo.url}</pre>
                      </div>

                      <p><strong>Parameters:</strong></p>
                      <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md overflow-auto max-h-40">
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(debugInfo.params, null, 2)}
                        </pre>
                      </div>

                      <p><strong>Cookies:</strong></p>
                      <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md overflow-auto max-h-40">
                        <pre className="text-xs whitespace-pre-wrap break-all">{debugInfo.cookies}</pre>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}