// src/app/not-found.tsx
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-12">
        <div className="container mx-auto px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <h1 className="text-3xl font-bold mb-4 sm:text-4xl lg:text-5xl">
              404 - Page Not Found
            </h1>
            <p className="text-base mb-6 sm:text-lg lg:text-xl">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <a
              href="/"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded w-full max-w-xs sm:w-auto sm:max-w-none"
            >
              Go back to homepage
            </a>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}