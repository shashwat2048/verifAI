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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[180px]">
        {/* Large Scan Card */}
        <Link
          href="/analyze"
          className="group relative md:col-span-2 md:row-span-2 rounded-3xl border border-border bg-gradient-to-br from-card to-primary/5 p-8 flex flex-col justify-between overflow-hidden hover:shadow-[0_0_40px_rgba(96,34,237,0.2)] hover:border-primary/30 transition-all duration-500"
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

        {/* History Card */}
        <Link
          href="/reports"
          className="group relative md:col-span-1 md:row-span-2 rounded-3xl border border-border bg-card p-6 flex flex-col overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary-foreground group-hover:bg-secondary/20 transition-colors">
              <History className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-1">History</h3>
          <p className="text-sm text-muted-foreground mb-6">Recent scans</p>

          <div className="flex-1 space-y-3">
            {recent.length > 0 ? (
              recent.map((r, i) => (
                <div key={r.id} className="p-3 rounded-xl bg-muted/30 border border-border/50 text-sm flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="font-medium text-foreground truncate">Scan #{r.id.slice(-4)}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.isDeepfake ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                    {r.isDeepfake ? 'FAKE' : 'REAL'}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground/50 italic">
                <History className="w-8 h-8 mb-2 opacity-20" />
                No recent history
              </div>
            )}
          </div>
        </Link>

        {/* Profile Card */}
        <Link
          href="/profile"
          className="group relative md:col-span-1 rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover:border-primary/30 hover:bg-muted/30 transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 group-hover:scale-110 transition-transform">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Profile</h3>
              <p className="text-xs text-muted-foreground">Manage settings</p>
            </div>
          </div>
        </Link>

        {/* Tips Card */}
        <div className="group relative md:col-span-2 rounded-3xl border border-border bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:border-emerald-500/20 transition-all duration-300">
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


