import { processCallback } from "@/actions/auth-actions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Define the correct types for Next.js 15
type Props = {
  params: {};
  searchParams: Promise<{
    code?: string | string[];
    state?: string | string[];
    error?: string | string[];
  }>;
};

export default async function XAuthCallbackPage({ searchParams }: Props) {
  // Await the searchParams Promise in Next.js 15
  const resolvedSearchParams = await searchParams;
  
  // Handle search parameters (Next.js 15 may return arrays for multi-value params)
  const code =
    typeof resolvedSearchParams.code === "string"
      ? resolvedSearchParams.code
      : Array.isArray(resolvedSearchParams.code)
      ? resolvedSearchParams.code[0]
      : undefined;
  const state =
    typeof resolvedSearchParams.state === "string"
      ? resolvedSearchParams.state
      : Array.isArray(resolvedSearchParams.state)
      ? resolvedSearchParams.state[0]
      : undefined;
  const error =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : Array.isArray(resolvedSearchParams.error)
      ? resolvedSearchParams.error[0]
      : undefined;

  console.log("Auth callback parameters:", { code, state, error });

  // Handle errors from X.com
  if (error) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-red-500 mb-4">
          {error === "access_denied"
            ? "You denied access to your X account."
            : `An error occurred during authentication: ${error}`}
        </p>
        <a
          href="/"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
        >
          Return to Home
        </a>
      </div>
    );
  }

  // Validate required parameters
  if (!code || !state) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-red-500 mb-4">Missing code or state parameters.</p>
        <a
          href="/"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
        >
          Return to Home
        </a>
      </div>
    );
  }

  try {
    // Process the callback using the server action
    const result = await processCallback(code, state);

    if (result.error) {
      return (
        <div className="container mx-auto p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
          <p className="text-red-500 mb-4">{result.error}</p>
          <div className="bg-gray-100 p-4 rounded-md text-left mb-4 max-w-lg mx-auto">
            <h2 className="font-semibold mb-2">Debug Information:</h2>
            <p>Code: {code ? code.substring(0, 10) + "..." : "Missing"}</p>
            <p>State: {state ? state.substring(0, 10) + "..." : "Missing"}</p>
          </div>
          <a
            href="/"
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
          >
            Return to Home
          </a>
        </div>
      );
    }

    if (result.redirect) {
      redirect(result.redirect);
    }

    // Fallback if no redirect is provided (should not happen)
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Successful</h1>
        <p className="mb-4">You have been authenticated successfully.</p>
        <a
          href="/"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
        >
          Return to Home
        </a>
      </div>
    );
  } catch (error) {
    console.error("Error handling X callback:", error);
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-red-500 mb-4">
          An unexpected error occurred during authentication.
        </p>
        <div className="bg-gray-100 p-4 rounded-md text-left mb-4 max-w-lg mx-auto">
          <h2 className="font-semibold mb-2">Debug Information:</h2>
          <p>Error: {error instanceof Error ? error.message : String(error)}</p>
        </div>
        <a
          href="/"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
        >
          Return to Home
        </a>
      </div>
    );
  }
}