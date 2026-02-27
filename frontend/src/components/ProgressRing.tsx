export function ProgressRing({ label, percent, color = '#ef4444' }: { label: string; percent: number; color?: string }) {
  const radius = 48;
  const stroke = 9;
  const normalized = Math.min(Math.max(percent, 0), 100);
  const c = 2 * Math.PI * radius;
  const offset = c - (normalized / 100) * c;

  return (
    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <svg width="120" height="120" className="-rotate-90">
        <circle cx="60" cy="60" r={radius} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
        <circle cx="60" cy="60" r={radius} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <p className="-mt-16 text-xl font-black text-slate-900">{normalized.toFixed(0)}%</p>
      <p className="mt-10 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
