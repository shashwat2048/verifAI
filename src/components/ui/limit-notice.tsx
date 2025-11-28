export default function LimitNotice({ remaining, max }: { remaining: number; max: number }){
  const over = remaining <= 0;
  return (
    <div
      className={`rounded-xl border p-3 text-xs ${
        over
          ? 'bg-red-500/10 border-red-500/70 text-red-300'
          : 'bg-amber-500/10 border-amber-400/70 text-amber-200'
      }`}
    >
      {over ? 'Free plan limit reached. Upgrade for unlimited scans.' : `Free: ${remaining} of ${max} scans left.`}
    </div>
  );
}


