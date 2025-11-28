"use client";
import { useEffect, useState } from "react";
import gql from "graphql-tag";
import { useAuth } from "@clerk/nextjs";
import { ChevronDown, Share2, Scan, History } from "lucide-react";
import { LoaderFive } from "@/components/ui/loader";
import AccessGateBanner from "@/components/ui/access-gate-banner";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

type Report = {
  id: string;
  isDeepfake: boolean;
  confidence: number;
  explanation: string;
  createdAt: string;
  imageUrl?: string | null;
  rawResponse?: string | null;
};

const GET_REPORTS = gql`query{ myReports { id isDeepfake confidence explanation createdAt imageUrl rawResponse } }`;

export default function ReportsPage() {
  const { userId } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function shareReport(r: Report) {
    try {
      const summary = [
        `VerifAI Scan Result`,
        `Verdict: ${r.isDeepfake ? 'Likely Fake' : 'Likely Real'}`,
        `Confidence: ${r.confidence}%`,
        `Explanation: ${r.explanation}`,
        `Shared via VerifAI`
      ].filter(Boolean).join('\n');

      if (navigator.share) {
        await navigator.share({ title: 'VerifAI Scan Result', text: summary });
        return;
      }
      await navigator.clipboard.writeText(summary);
      toast.success('Report summary copied to clipboard');
    } catch {
      toast.error('Unable to share this report');
    }
  }

  async function deleteReportById(id: string) {
    try {
      const mutation = `mutation($id: String!){ deleteReport(id: $id){ success message } }`;
      const res = await fetch('/api/graphql', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ query: mutation, variables: { id } })
      });
      const json = await res.json();
      const ok = json?.data?.deleteReport?.success;
      if (!ok) throw new Error(json?.data?.deleteReport?.message || 'Failed');
      setReports(reports => reports.filter(r => r.id !== id));
      setConfirmId(null);
      toast.success('Report deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete');
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ query: GET_REPORTS.loc?.source.body }),
        });
        const json = await res.json();
        const data: { myReports: any[] } = json?.data;
        if (!mounted) return;
        setReports(data?.myReports || []);
      } catch (err) {
        setReports([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [userId]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <AccessGateBanner />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-50">Your Scan History</h1>
        <p className="text-sm text-slate-300">Recent image scans with authenticity verdicts, signals, and explanations.</p>
      </div>
      {loading ? (
        <div className="min-h-[40vh] grid place-items-center"><LoaderFive text="Loading reports..." /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((r) => {
            return (
              <div
                key={r.id}
                className="group relative flex flex-col rounded-3xl border border-border bg-card overflow-hidden hover:shadow-[0_0_30px_rgba(96,34,237,0.1)] transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden bg-muted">
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt="report" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Scan className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`inline-flex items-center justify-center px-3 py-1 rounded-xl text-xs font-bold shadow-sm ${r.isDeepfake ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                        }`}
                    >
                      {r.isDeepfake ? 'FAKE' : 'REAL'}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-foreground truncate" title={r.explanation}>{r.explanation}</h3>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-muted/50 text-muted-foreground border border-border">
                      Confidence: {r.confidence}%
                    </span>
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
                    <button
                      onClick={() => shareReport(r)}
                      className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </button>
                    <button
                      onClick={() => setConfirmId(r.id)}
                      className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {reports.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
                <History className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">No scans yet</h3>
                <p className="text-sm text-muted-foreground">Your scan history will appear here.</p>
              </div>
            </div>
          )}
        </div>
      )}
      {confirmId && (
        <div className="fixed inset-0 z-[1006] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmId(null)} />
          <div className="relative w-full sm:w-[420px] rounded-t-2xl sm:rounded-2xl border backdrop-blur bg-white/90 dark:bg-black/70 shadow-xl p-4 sm:p-6">
            <div className="text-center space-y-2">
              <h3 className="text-base sm:text-lg font-semibold">Delete this report?</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-300">This action cannot be undone.</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmId(null)} className="h-10 rounded-md border">No</button>
              <button onClick={() => deleteReportById(confirmId)} className="h-10 rounded-md bg-red-600 text-white hover:bg-red-700">Yes, delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


