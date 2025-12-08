"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, History, Scan, User, Lightbulb } from "lucide-react";

type Report = { id: string; isDeepfake: boolean; createdAt: string };

export default function HomeCards() {
  const [recent, setRecent] = useState<Report[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const query = `query{ myReports { id isDeepfake createdAt } }`;
        const res = await fetch('/api/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ query }) });
        const json = await res.json();
        const data: { myReports?: Report[] } = json?.data || {};
        setRecent((data?.myReports || []).slice(0, 3));
      } catch { }
    })();
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      {/* 1 column on mobile, 2 columns on md+; let height grow naturally so text isn't clipped */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-stretch">
        {/* Scan Card */}
        <Link
          href="/analyze"
          className="group relative rounded-3xl border border-border bg-gradient-to-br from-card to-primary/5 p-8 flex flex-col justify-between overflow-hidden hover:shadow-[0_0_40px_rgba(96,34,237,0.2)] hover:border-primary/30 transition-all duration-500"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-primary/20" />

          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-6 group-hover:scale-110 transition-transform duration-500">
              <Scan className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">Start New Scan</h3>
            <p className="text-muted-foreground max-w-md">Upload or capture an image to verify authenticity. Our AI analyzes pixel patterns, lighting inconsistencies, and metadata.</p>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-primary font-medium mt-4 group-hover:translate-x-1 transition-transform">
            <span className="border-b border-primary/0 group-hover:border-primary transition-colors">Scan now</span> <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Tips Card */}
        <div className="group relative rounded-3xl border border-border bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:border-emerald-500/20 transition-all duration-300">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 shrink-0 group-hover:rotate-12 transition-transform duration-500">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Pro Tip</h3>
            <p className="text-sm text-muted-foreground">For best results, ensure the subject's face is clearly visible and well-lit. Avoid heavy compression or filters before scanning.</p>
          </div>
        </div>
      </div>
    </section>
  );
}


