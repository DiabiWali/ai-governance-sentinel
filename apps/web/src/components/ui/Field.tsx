import type { ReactNode } from "react";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {children}
    </label>
  );
}
