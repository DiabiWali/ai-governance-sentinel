export function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-cyan-400/10">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold capitalize text-white">{value}</p>
      <div className="mt-4 h-1 w-10 rounded-full bg-cyan-400/40 transition group-hover:w-16 group-hover:bg-cyan-300" />
    </div>
  );
}
