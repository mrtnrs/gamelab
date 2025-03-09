import Header from '@/components/header';
import Footer from '@/components/footer';

export default function AuthCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen flex flex-col justify-center items-center py-12">
        {children}
      </main>
      <Footer />
    </>
  );
}
