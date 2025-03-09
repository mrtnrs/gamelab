// src/app/error/page.tsx
import Header from '@/components/header';
import Footer from '@/components/footer';

// Define the correct types for Next.js 15
type Props = {
  params: Promise<{}>
  searchParams: Promise<{ message?: string, error?: string }>
}

export default async function ErrorPage({ params, searchParams }: Props) {
  await params; // Await the Promise for params
  const resolvedSearchParams = await searchParams; // Await the Promise for searchParams
  
  const message = resolvedSearchParams.message || 'An unexpected error occurred';
  const error = resolvedSearchParams.error || '';
  
  let displayMessage = '';
  
  // Map error codes to user-friendly messages
  switch (message) {
    case 'session-expired':
      displayMessage = 'Your session has expired. Please try again.';
      break;
    case 'invalid-state':
      displayMessage = 'Invalid authentication state. This could be due to an expired session or a security issue.';
      break;
    default:
      displayMessage = Array.isArray(message) ? message[0] : message.toString();
  }
  
  // If there's a specific error message, show it
  const errorDetails = error ? (Array.isArray(error) ? error[0] : error.toString()) : '';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-12">
        <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold mb-4 text-center">Error</h1>
            
            <div className="mb-6 text-center">
              <p className="text-red-500 mb-2">{displayMessage}</p>
              {errorDetails && (
                <p className="text-sm text-muted-foreground">
                  Error details: {errorDetails}
                </p>
              )}
            </div>
            
            <div className="flex justify-center">
              <a
                href="/"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}