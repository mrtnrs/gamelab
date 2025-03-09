import type { Metadata } from "next";
import { URL } from "url";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import AuthProvider from "@/components/auth-provider";
import { BookmarkProvider } from "@/contexts/bookmark-context";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GameLab - AI Created Games",
  description: "Discover AI-vibe-coded games for immersive multiplayer fun. Play browser games created with artificial intelligence.",
  keywords: "ai games, browser games, online games, multiplayer games, mobile games, free games, ai-created games, gamelab",
  authors: [{ name: "GameLab Team" }],
  creator: "GameLab",
  publisher: "GameLab",
  icons: {
    icon: "/gamepad.svg",
    shortcut: "/gamepad.svg",
    apple: "/gamepad.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://gamelab.example.com',
    siteName: 'GameLab',
    title: 'GameLab - AI Created Games',
    description: 'Discover AI-vibe-coded games for immersive multiplayer fun. Play browser games created with artificial intelligence.',
    images: [
      {
        url: '/og-image.jpg', // Create this image in the public folder
        width: 1200,
        height: 630,
        alt: 'GameLab - AI Created Games',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GameLab - AI Created Games',
    description: 'Discover AI-vibe-coded games for immersive multiplayer fun. Play browser games created with artificial intelligence.',
    images: ['/og-image.jpg'], // Create this image in the public folder
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://gamelab.example.com',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://gamelab.example.com'),
};

export const runtime = "nodejs";
export const dynamic = "force-static";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <BookmarkProvider>
              {children}
              
            </BookmarkProvider>
          </AuthProvider>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
