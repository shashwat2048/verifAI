"use client";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

export default function HomeHeroActions() {
  const { isSignedIn } = useAuth();
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
      {isSignedIn ? (
        <>
          <Link
            href="/analyze"
            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-primary px-8 font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-105 hover:shadow-[0_0_20px_rgba(96,34,237,0.3)]"
          >
            <div className="absolute inset-0 flex items-center justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
              <div className="relative h-full w-8 bg-white/20" />
            </div>
            <span className="flex items-center gap-2">
              Start a Scan
            </span>
          </Link>
        </>
      ) : (
        <Link
          href="/sign-in"
          className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-primary px-8 font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-105 hover:shadow-[0_0_20px_rgba(96,34,237,0.3)]"
        >
          <div className="absolute inset-0 flex items-center justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
            <div className="relative h-full w-8 bg-white/20" />
          </div>
          <span className="flex items-center gap-2">
            Sign up to verify media
          </span>
        </Link>
      )}
    </div>
  );
}


