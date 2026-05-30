import type { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          {description && (
            <p className="mt-2 max-w-3xl text-slate-400">{description}</p>
          )}
        </div>
        {action}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}
