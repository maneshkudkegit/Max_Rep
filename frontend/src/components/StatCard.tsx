import { motion } from 'framer-motion';

export function StatCard({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-card backdrop-blur"
    >
      <p className="text-xs uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </motion.div>
  );
}
