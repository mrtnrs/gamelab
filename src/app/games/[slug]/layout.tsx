// Create this file at: /src/app/games/[slug]/layout.tsx
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}