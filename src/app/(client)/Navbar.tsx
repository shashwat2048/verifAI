"use client";
import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ModeToggle } from "@/components/ui/theme-toggle-btn";
import { Settings2, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RainbowButton } from "@/components/ui/rainbow-button";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [role, setRole] = useState<'free' | 'pro'>('free');
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const q = `query { myQuota { role unlimited } }`;
        const res = await fetch('/api/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ query: q }) });
        const j = await res.json();
        const r = j?.data?.myQuota?.role as string | undefined;
        if (mounted && r) setRole(r === 'pro' ? 'pro' : 'free');
      } catch { }
    })();
    return () => { mounted = false };
  }, []);

  return (
    <header className="sticky top-0 z-50 overflow-visible backdrop-blur-2xl backdrop-saturate-150 bg-background/30 border-b border-border/40">
      <div className="mx-auto max-w-6xl px-4 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
            <span className="relative inline-grid place-items-center size-8 rounded-md bg-card border border-border shadow-sm">
              <Image src="/verifai_logo.png" alt="VerifAI" width={30} height={30} className="rounded" />
            </span>
            <span className="sm:inline">VerifAI</span>
          </Link>
          <nav className="hidden justify-center sm:flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition transform duration-200">Home</Link>
            <Link href="/analyze" className="hover:text-primary transition transform duration-200">Scan</Link>
            <Link href="/reports" className="hover:text-primary transition transform duration-200">History</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <ModeToggle />
          {/* Mobile Unlimited Access CTA (replaces dropdown) */}

          {/* Desktop profile text link (only when signed in) */}
          <SignedOut>
            <div className="flex items-center gap-3">
              <Link href="/sign-in" className="text-sm hover:text-primary transition transform duration-200">Sign In</Link>
            </div>
          </SignedOut>
          <SignedIn>

            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}


