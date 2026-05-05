export function SaveShareBar({ canSave, onSave, onShare }: {
  canSave: boolean; onSave: ()=>void; onShare: ()=>void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between rounded-xl border p-3 bg-slate-900/70 dark:bg-slate-900/70">
      <div className="text-xs text-neutral-600 dark:text-neutral-300">
        Reports are saved to your account. You can share this scan or keep it private.
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onShare} className="px-3 py-2 rounded-md border border-slate-700/80 text-sm text-slate-200 hover:bg-slate-800/80">
          Share
        </button>
        {canSave && (
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 rounded-md bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm hover:shadow-[0_0_18px_rgba(59,130,246,0.4)]"
          >
            Save Scan
          </button>
        )}
      </div>
    </div>
  );
}


