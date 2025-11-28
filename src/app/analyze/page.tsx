"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/ui/file-upload";
import { GridPattern } from "@/components/ui/file-upload";
import { LoaderFive } from "@/components/ui/loader";

import { StepHeader } from "@/components/ui/step-header";
import { SaveShareBar } from "@/components/ui/save-share-bar";
import { BlurIndicator } from "@/components/ui/blur-indicator";
import LimitNotice from "@/components/ui/limit-notice";

export default function AnalyzePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [result, setResult] = useState<null | {
    isDeepfake: boolean;
    confidence: number;
    explanation: string;
    saved?: boolean;
  }>(null);
  const [quota, setQuota] = useState<{ role: string; used: number; max: number; remaining: number; unlimited: boolean } | null>(null);
  const [blurScore, setBlurScore] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    }
  }, []);

  useEffect(() => {
    async function fetchQuota() {
      try {
        const query = `query { myQuota { role used max remaining unlimited } }`;
        const res = await fetch('/api/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ query }) });
        const json = await res.json();
        const q = json?.data?.myQuota || null;
        if (q) setQuota(q);
      } catch { }
    }
    fetchQuota();
  }, []);

  async function startCamera(nextFacing?: 'environment' | 'user') {
    setError(null);
    try {
      const facing = nextFacing || cameraFacing;
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setCameraFacing(facing);
      if (torchOn) {
        try { await applyTorch(true); } catch { }
      }
    } catch (e) {
      setError("Camera access denied or unavailable");
    }
  }

  function captureFrame() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const f = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      setFile(f);
      const url = URL.createObjectURL(blob);
      setPreview(url);
      setShowConfirm(true);
      // compute simple blur score
      computeBlurScore(canvas).then(setBlurScore).catch(() => setBlurScore(null));
    }, "image/jpeg", 0.9);
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
  }

  async function applyTorch(desired: boolean): Promise<boolean> {
    try {
      const track = streamRef.current?.getVideoTracks?.()[0];
      const caps: any = track && (track as any).getCapabilities ? (track as any).getCapabilities() : null;
      if (track && caps && 'torch' in caps) {
        await (track as any).applyConstraints({ advanced: [{ torch: desired }] });
        return true;
      }
    } catch { }
    return false;
  }

  async function toggleTorch() {
    if (!cameraOn) { toast("Start camera first"); return; }
    const want = !torchOn;
    const ok = await applyTorch(want);
    if (!ok) {
      toast("Flash not supported on this device/browser");
      setTorchOn(false);
      return;
    }
    setTorchOn(want);
  }

  async function switchCamera() {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    stopCamera();
    setTimeout(() => { startCamera(next); }, 50);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function clearImage() {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setResult(null);
  }

  function handleFileUpload(files: File[]) {
    if (!files || files.length === 0) return;
    const first = files[0];
    setFile(first);
    try {
      if (preview) URL.revokeObjectURL(preview);
    } catch { }
    setPreview(URL.createObjectURL(first));
    setShowConfirm(true);
    // attempt blur score after load
    setTimeout(async () => {
      try {
        if (!canvasRef.current) return;
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          computeBlurScore(canvas).then(setBlurScore).catch(() => setBlurScore(null));
        };
        img.src = URL.createObjectURL(first);
      } catch { }
    }, 0);
  }

  async function onSubmit() {
    if (!file) return;
    setShowConfirm(false);
    setBusy(true);
    setError(null);
    try {
      const freeLimitHit = quota && !quota.unlimited && quota.role === 'free' && quota.remaining <= 0;
      if (freeLimitHit) {
        toast.error(`Free plan limit reached. Upgrade to Pro for unlimited analyses.`);
        setBusy(false);
        return;
      }
      const base64 = await fileToBase64(file);
      const query = `mutation Analyze($imageBase64: String!) { analyzeLabel(imageBase64: $imageBase64) { imageUrl isDeepfake confidence explanation saved scanId } }`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ query, variables: { imageBase64: base64 } }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Failed to analyze");
      }
      const json = await res.json();
      if (json?.errors?.length) {
        const msg = json.errors[0]?.message || 'Request failed';
        throw new Error(msg);
      }
      const data = json?.data?.analyzeLabel;
      if (!data) throw new Error('No result');
      // Refresh quota after analysis (server increments analysesDone for free)
      try {
        const q = `query { myQuota { role used max remaining unlimited } }`;
        const r2 = await fetch('/api/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ query: q }) });
        const j2 = await r2.json();
        if (j2?.data?.myQuota) setQuota(j2.data.myQuota);
      } catch { }

      setResult({
        isDeepfake: data.isDeepfake,
        confidence: data.confidence,
        explanation: data.explanation,
        saved: data.saved,
      });

      toast.success(data.saved ? "Scan saved" : "Analysis ready");
      setShowConfirm(false);
      // haptic / visual small feedback on success
      try { if (navigator.vibrate) navigator.vibrate(20); } catch { }

      if (data.saved && data.scanId) {
        // Redirect to reports to view full analysis
        // setTimeout(() => router.push('/reports'), 400);
      }
    } catch (e: any) {
      const msg = e?.message?.includes('limit') ? e.message : (e?.message || "Upload failed");
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  function fileToBase64(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  }

  // Simple Tenengrad-like focus measure using Sobel gradients on a downscaled patch
  async function computeBlurScore(canvas: HTMLCanvasElement): Promise<number> {
    const w = Math.max(64, Math.min(256, Math.floor(canvas.width / 4)));
    const h = Math.max(64, Math.min(256, Math.floor(canvas.height / 4)));
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const tctx = tmp.getContext('2d');
    if (!tctx) return Promise.resolve(NaN);
    tctx.drawImage(canvas, 0, 0, w, h);
    const img = tctx.getImageData(0, 0, w, h);
    const g = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const o = i * 4;
      g[i] = 0.2126 * img.data[o] + 0.7152 * img.data[o + 1] + 0.0722 * img.data[o + 2];
    }
    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
    let sum = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let gx = 0, gy = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const val = g[(y + ky) * w + (x + kx)];
            gx += val * sobelX[ky + 1][kx + 1];
            gy += val * sobelY[ky + 1][kx + 1];
          }
        }
        const mag = Math.sqrt(gx * gx + gy * gy);
        sum += mag;
      }
    }
    // Normalize roughly by number of pixels
    return sum / (w * h);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
      {/* Left Panel - Input */}
      <div className="w-full lg:w-1/2 p-6 lg:p-12 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-border bg-card/30 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-xl mx-auto w-full space-y-8 relative z-10">
          <div className="space-y-2">
            <StepHeader step={file ? (result ? 3 : 2) : 1} />
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Verify Authenticity</h1>
            <p className="text-muted-foreground text-lg">Upload an image or use your camera to detect deepfakes.</p>
            {quota && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-xs font-medium text-muted-foreground border border-border">
                <span>{quota.role === 'pro' ? 'Pro Plan' : 'Free Plan'}</span>
                <span className="w-1 h-1 rounded-full bg-current" />
                <span>{quota.unlimited ? 'Unlimited scans' : `${quota.remaining} scans left`}</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {!file ? (
              <div className="grid gap-6">
                <div className="rounded-3xl border border-border bg-card p-1 shadow-sm">
                  <FileUpload onChange={handleFileUpload} />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or use camera</span>
                  </div>
                </div>

                <button
                  onClick={() => startCamera()}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 flex items-center justify-center gap-2 text-muted-foreground hover:text-primary font-medium"
                >
                  Click to open camera
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative rounded-3xl overflow-hidden border border-border bg-black/5 shadow-2xl aspect-video group">
                  {preview && (
                    <img src={preview} alt="preview" className="w-full h-full object-contain bg-black/80" />
                  )}
                  <div className="absolute top-4 right-4">
                    <BlurIndicator score={blurScore} />
                  </div>
                  <button
                    onClick={clearImage}
                    className="absolute top-4 left-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    disabled={busy || !!(quota && !quota.unlimited && quota.role === 'free' && quota.remaining <= 0)}
                    onClick={onSubmit}
                    className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {busy ? 'Analyzing...' : 'Run Deepfake Scan'}
                  </button>
                  <button
                    onClick={clearImage}
                    className="px-6 py-3.5 rounded-xl border border-border hover:bg-muted transition-colors font-medium"
                  >
                    Reset
                  </button>
                </div>
                {error && <p className="text-destructive text-sm text-center">{error}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Results/Preview */}
      <div className="w-full lg:w-1/2 bg-muted/30 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-xl mx-auto w-full h-full flex flex-col">
          {busy ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
              <LoaderFive text="" />
              <div>
                <h3 className="text-xl font-semibold text-foreground">Analyzing Media</h3>
                <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Our AI is checking for compression artifacts, lighting inconsistencies, and metadata anomalies.</p>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Analysis Results</h2>
                <div className="flex gap-2">
                  <SaveShareBar
                    canSave={!result.saved}
                    onSave={onSubmit}
                    onShare={() => navigator.share ? navigator.share({ title: 'VerifAI Scan Result', text: 'Deepfake detection result from VerifAI' }).catch(() => { }) : null}
                    onUpgrade={() => window.location.href = '/profile'}
                    plan={quota ? (quota.unlimited ? 'pro' : 'free') : 'free'}
                  />
                </div>
              </div>

              {/* Verdict Card */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Authenticity Verdict</div>
                    <div className={`text-3xl font-bold ${result.isDeepfake ? 'text-destructive' : 'text-emerald-500'}`}>
                      {result.isDeepfake ? 'Likely Fake' : 'Likely Real'}
                    </div>
                  </div>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shadow-inner ${result.isDeepfake ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {result.confidence}%
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-muted/50 text-sm leading-relaxed text-foreground">
                  {result.explanation}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px] opacity-50">
              <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /><line x1="21" x2="9" y1="5" y2="17" /><line x1="9" x2="9" y1="17" y2="17" /></svg>
              </div>
              <h3 className="text-lg font-medium">No analysis yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs">Upload an image to see deepfake detection results here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Camera Modal Overlay */}
      {cameraOn && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="relative flex-1 bg-black">
            <video ref={videoRef} className="w-full h-full object-contain" playsInline muted />
            <div className="absolute inset-0 pointer-events-none">
              <GridPattern />
            </div>
            <div className="absolute top-4 right-4 z-20">
              <BlurIndicator score={blurScore} />
            </div>
          </div>
          <div className="p-6 bg-black/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-between gap-4 safe-area-pb">
            <button onClick={stopCamera} className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
              <span className="sr-only">Close</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
            <button onClick={captureFrame} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white active:scale-90 transition-transform" />
            </button>
            <div className="flex gap-2">
              <button onClick={toggleTorch} className={`p-4 rounded-full transition-colors ${torchOn ? 'bg-amber-500 text-black' : 'bg-white/10 text-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>
              </button>
              <button onClick={switchCamera} className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 8-4-4H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8z" /><path d="m14 8-2-2-2 2" /><path d="M12 2v6" /></svg>
              </button>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
}
