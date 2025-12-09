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

// Resolve absolute app URL for social metadata
// Default to production deployment if env is not set
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://verifai-ai.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "VerifAI — AI-Powered Deepfake Detection",
    template: "%s | VerifAI",
  },
  description: "Deepfake image detection and media authenticity checks for images and text, powered by Gemini.",
  metadataBase: new URL(APP_URL),
  keywords: [
    "VerifAI",
    "deepfake detection",
    "AI deepfake detector",
    "image authenticity",
    "media verification",
    "AI content detection",
    "fake image detector",
    "deep fake checker",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "VerifAI — AI-Powered Deepfake Detection",
    description: "Scan images and text for deepfakes, AI generation and media manipulation. Get a clear verdict, confidence score, and explanation.",
    url: APP_URL,
    siteName: "VerifAI",
    images: [
      {
        url: `${APP_URL}/verifai1.png`,
        width: 1200,
        height: 630,
        alt: "VerifAI deepfake detection dashboard",
      },
      {
        url: `${APP_URL}/verifai_logo.png`,
        width: 512,
        height: 512,
        alt: "VerifAI logo",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "VerifAI — AI-Powered Deepfake Detection",
    description: "Scan images and text for deepfakes, AI generation and media manipulation with VerifAI.",
    images: [`${APP_URL}/verifai1.png`],
    site: "@verifai",
    creator: "@verifai",
  },
  icons: {
    icon: "/verifai_logo.ico",
    apple: "/verifai_logo.ico",
    shortcut: "/verifai_logo.ico",
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
