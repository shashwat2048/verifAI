import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import Navbar from "./(client)/Navbar";
import Script from "next/script";
import ProStatusWatcher from "@/components/ui/pro-status-watcher";
import { UserProvider } from "@/components/ui/user-context";
import RouteProgress from "@/components/ui/route-progress";
import MobileBottomNav from "@/components/ui/mobile-bottom-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Resolve absolute app URL for social metadata (works on Vercel and locally)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  title: "VerifAI",
  description: "Deepfake image detection and media authenticity checks powered by Gemini.",
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "VerifAI — AI-Powered Deepfake Detection",
    description: "Upload images to detect deepfakes, assess authenticity, and get a clear confidence score.",
    url: "/",
    siteName: "VerifAI",
    images: [
      {
        url: `${APP_URL}/verifai_logo.png`,
        width: 1200,
        height: 630,
        alt: "VerifAI",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "VerifAI — AI-Powered Deepfake Detection",
    description: "Upload images to detect deepfakes, assess authenticity, and get a clear confidence score.",
    images: [`${APP_URL}/verifai_logo.png`],
    site: "@verifai",
    creator: "@verifai",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <div className="fixed inset-0 -z-10 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent dark:from-primary/10 dark:via-transparent" />
            </div>

            <UserProvider>
              <Navbar />
              <RouteProgress />
              <ProStatusWatcher />
              <main className="pb-8 sm:pb-0">{children}</main>
              <MobileBottomNav />
            </UserProvider>
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
