import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[20%] top-[-180px] h-[560px] w-[760px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[-160px] top-[260px] h-[460px] w-[460px] rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-[-160px] left-[-160px] h-[460px] w-[460px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0)_0,_rgba(2,6,23,0.92)_60%)]" />
      </div>

      <div className="mx-auto w-full max-w-[1680px] px-4 py-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
