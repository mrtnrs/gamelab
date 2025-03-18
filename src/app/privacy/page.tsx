import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-16">
        <div className="container mx-auto py-12 px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-4">Last Updated: March 18, 2025</p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
              <p>
                Welcome to GameLab ("we," "our," or "us"). We are committed to protecting your privacy and handling your data 
                in a transparent and secure manner. This Privacy Policy explains how we collect, use, and safeguard your information 
                when you use our website and services.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
              <p>We collect the following types of information:</p>
              <ul className="list-disc ml-6 mb-4">
                <li className="mb-2">
                  <strong>Account Information:</strong> When you create an account, we collect your email address, display name, 
                  and social media profile information when you authenticate through X (Twitter).
                </li>
                <li className="mb-2">
                  <strong>User Content:</strong> Information you provide when uploading games, adding descriptions, updates, or 
                  comments.
                </li>
                <li className="mb-2">
                  <strong>Usage Data:</strong> Information about how you interact with our platform, including access times, 
                  pages viewed, and game interactions.
                </li>
                <li className="mb-2">
                  <strong>Device Information:</strong> Information about the device and browser you use to access our platform.
                </li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
              <p>We use your information for the following purposes:</p>
              <ul className="list-disc ml-6 mb-4">
                <li className="mb-2">To verify your identity and manage your account</li>
                <li className="mb-2">To enable game claiming and developer verification</li>
                <li className="mb-2">To provide, improve, and maintain our platform</li>
                <li className="mb-2">To communicate with you about updates and changes</li>
                <li className="mb-2">To analyze usage patterns and optimize user experience</li>
                <li className="mb-2">To prevent fraud and enhance security</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
              <p>
                We do not sell your personal information. We may share information with third-party service providers that help 
                us operate our platform (such as Supabase for authentication and database services). These providers are bound 
                by contractual obligations to keep personal information confidential and use it only for the purposes for which 
                we disclose it to them.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information. However, 
                no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute 
                security.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
              <p>Depending on your location, you may have the following rights:</p>
              <ul className="list-disc ml-6 mb-4">
                <li className="mb-2">The right to access personal information we hold about you</li>
                <li className="mb-2">The right to request correction of inaccurate data</li>
                <li className="mb-2">The right to request deletion of your data</li>
                <li className="mb-2">The right to withdraw consent</li>
                <li className="mb-2">The right to request restriction of processing</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy 
                Policy on this page and updating the "Last Updated" date.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
                <br />
                <a href="mailto:info@gamelab.fun" className="text-primary hover:underline">info@gamelab.fun</a>
              </p>
            </section>
          </div>
          
          <div className="mt-12 flex justify-center">
            <Link 
              href="/"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
