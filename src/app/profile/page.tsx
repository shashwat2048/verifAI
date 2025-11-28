"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { LoaderFive } from "@/components/ui/loader";
import { GridPattern } from "@/components/ui/file-upload";


type Profile = {
  name?: string | null;
  fitnessGoal?: string | null;
  allergies: string[];
};

const GET_PROFILE = `query GetProfile { getProfile { name fitnessGoal allergies } }`;

const GET_ME = `query Me { me { name email } }`;

const SAVE_PROFILE = `mutation SaveProfile($name: String, $fitnessGoal: String, $allergies: [String!]) {
  updateUserProfile(name: $name, fitnessGoal: $fitnessGoal, allergies: $allergies) {
    success
    message
  }
}`;

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<Profile | null>(null);
  const nav = useRouter();

  async function gqlFetch<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const res = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error('Request failed');
    const json = await res.json();
    if (json?.errors?.length) throw new Error(json.errors[0]?.message || 'GraphQL error');
    return json.data as T;
  }
  const [upgrading, setUpgrading] = useState(false);
  const [quota, setQuota] = useState<{ role: string; used: number; max: number; remaining: number; unlimited: boolean } | null>(null);
  const [meEmail, setMeEmail] = useState<string | null>(null);
  const [meName, setMeName] = useState<string | null>(null);
  const [cardMode, setCardMode] = useState<boolean>(true);
  const router = useRouter();

  const { register, handleSubmit, setValue, watch } = useForm<Profile>({
    defaultValues: { name: "", fitnessGoal: "", allergies: [] },
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await gqlFetch<{ getProfile: Profile | null }>(GET_PROFILE);
        if (!mounted) return;
        setInitial(data.getProfile ?? { name: "", fitnessGoal: "", allergies: [] });
        setValue("name", data.getProfile?.name ?? "");
        setValue("fitnessGoal", data.getProfile?.fitnessGoal ?? "");
        setValue("allergies", data.getProfile?.allergies ?? []);
      } catch (err) {
        setInitial({ name: "", fitnessGoal: "", allergies: [] });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [setValue]);

  // Toast payment status based on query param
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const up = sp.get('upgrade');
      if (up === 'success') {
        toast.success('Payment successful. You are now on Pro.');
      } else if (up === 'cancelled') {
        toast('Checkout cancelled');
      }
    } catch { }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await gqlFetch<{ myQuota: any }>(`query { myQuota { role used max remaining unlimited } }`);
        if (mounted) setQuota(res.myQuota);
      } catch { }
      try {
        const r = await gqlFetch<{ me?: { name?: string | null; email?: string | null } | null }>(GET_ME);
        if (mounted) {
          setMeEmail(r?.me?.email || null);
          setMeName(r?.me?.name || null);
        }
      } catch { }
    })();
    return () => { mounted = false };
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await gqlFetch<{ updateUserProfile: { success: boolean; message?: string } }>(
        SAVE_PROFILE,
        { name: values.name || null, fitnessGoal: values.fitnessGoal || null, allergies: values.allergies || [] }
      );
      if (!res.updateUserProfile.success) throw new Error(res.updateUserProfile.message || 'Failed to save');
      toast.success("Preferences saved");
      // Refetch latest profile and refresh form + card state
      try {
        const fresh = await gqlFetch<{ getProfile: Profile | null }>(GET_PROFILE);
        const next = fresh.getProfile ?? { name: "", fitnessGoal: "", allergies: [] };
        setInitial(next);
        setValue("name", next.name ?? "");
        setValue("fitnessGoal", next.fitnessGoal ?? "");
        setValue("allergies", next.allergies ?? []);
      } catch { }
      setCardMode(true);
      try { nav.refresh(); } catch { }
    } catch (err: any) {
      // Fallback to REST if GraphQL auth fails
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('unauthorized')) {
        try {
          const resp = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name: values.name || null, fitnessGoal: values.fitnessGoal || null, allergies: values.allergies || [] }),
          });
          const json = await resp.json();
          if (!resp.ok || !json?.success) throw new Error(json?.message || 'Failed');
          toast.success('Preferences saved');
          try {
            const fresh = await gqlFetch<{ getProfile: Profile | null }>(GET_PROFILE);
            const next = fresh.getProfile ?? { name: "", fitnessGoal: "", allergies: [] };
            setInitial(next);
            setValue("name", next.name ?? "");
            setValue("fitnessGoal", next.fitnessGoal ?? "");
            setValue("allergies", next.allergies ?? []);
          } catch { }
          setCardMode(true);
          try { nav.refresh(); } catch { }
          return;
        } catch (e: any) {
          toast.error(e?.message || 'Failed to save Preferences');
          return;
        }
      }
      toast.error(err?.message || "Failed to save Preferences");
    }
  });

  const allergies: string[] = watch("allergies");

  if (loading) return (
    <div className="min-h-[40vh] grid place-items-center p-6">
      <LoaderFive text="Loading Preferences..." />
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-3 gap-8">
        {/* Sidebar / Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm text-center">
            <div className={`w-24 h-24 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold mb-4 ${quota?.role === 'pro' ? 'ring-4 ring-primary/20' : ''}`}>
              {(initial?.name || meName || 'U')?.slice(0, 1)?.toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-foreground">{initial?.name || meName || 'User'}</h2>
            <p className="text-sm text-muted-foreground mb-6">{meEmail || '—'}</p>

            <div className="grid grid-cols-2 gap-4 text-left border-t border-border pt-6">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Plan</div>
                <div className="font-semibold text-foreground">{quota?.role === 'pro' ? 'Pro' : 'Free'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Scans</div>
                <div className="font-semibold text-foreground">{quota?.unlimited ? '∞' : quota?.remaining}</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-6">
            <h3 className="font-semibold text-foreground mb-2">Why complete your profile?</h3>
            <p className="text-sm text-muted-foreground">VerifAI uses your preferences to tailor deepfake detection explanations and risk assessments specifically for you.</p>
          </div>
        </div>

        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <div className="relative z-10">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
                <p className="text-muted-foreground">Manage your personal details and analysis preferences.</p>
              </div>

              {cardMode ? (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Display Name</div>
                      <div className="font-medium text-foreground text-lg">{initial?.name || '—'}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Fitness Goal</div>
                      <div className="font-medium text-foreground text-lg capitalize">{initial?.fitnessGoal?.replace('_', ' ') || '—'}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Allergies / Sensitivities</div>
                    <div className="flex flex-wrap gap-2">
                      {(initial?.allergies || []).length > 0 ? (
                        initial!.allergies.map(a => (
                          <span key={a} className="px-3 py-1 rounded-full bg-background border border-border text-sm font-medium text-foreground shadow-sm">
                            {a}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground italic">None selected</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => setCardMode(false)}
                      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Display Name</label>
                      <input
                        {...register("name")}
                        placeholder="Your name"
                        className="w-full h-11 rounded-xl border border-border bg-background px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Fitness Goal</label>
                      <select
                        {...register("fitnessGoal")}
                        className="w-full h-11 rounded-xl border border-border bg-background px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      >
                        <option value="">Select a goal</option>
                        <option value="weight_loss">Weight Loss</option>
                        <option value="muscle_gain">Muscle Gain</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="endurance">Endurance</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Allergies & Sensitivities</label>
                    <div className="flex flex-wrap gap-2">
                      {["peanuts", "gluten", "dairy", "soy", "eggs", "shellfish"].map((opt) => {
                        const active = allergies?.includes(opt as any);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              const next = active ? allergies.filter(a => a !== opt) : [...(allergies || []), opt];
                              setValue("allergies", next, { shouldDirty: true });
                            }}
                            className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${active
                                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                                : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                              }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValue("name", initial?.name ?? "");
                        setValue("fitnessGoal", initial?.fitnessGoal ?? "");
                        setValue("allergies", initial?.allergies ?? []);
                        setCardMode(true);
                      }}
                      className="px-6 py-2.5 rounded-xl border border-border bg-background hover:bg-muted transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


