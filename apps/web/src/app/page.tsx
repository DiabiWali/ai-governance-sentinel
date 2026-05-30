"use client";

import { useState } from "react";

type RiskFactor = {
  label: string;
  severity: string;
  recommendation: string;
};

type RiskResponse = {
  agent_name: string;
  risk_score: number;
  risk_level: string;
  factors: RiskFactor[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [result, setResult] = useState<RiskResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function runAssessment() {
    setLoading(true);
    setResult(null);

    const payload = {
      name: "HR Assistant",
      purpose: "Answer HR policy questions and draft internal emails",
      model_provider: "OpenAI",
      data_sensitivity: "confidential",
      autonomy_level: "fully_autonomous",
      connectors: ["sharepoint", "outlook", "hr_api"],
      internet_exposed: false,
      human_approval_required: false,
      stores_prompts: true,
      stores_outputs: true,
    };

    try {
      const response = await fetch(`${API_URL}/risk/assess`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Risk assessment failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Unable to reach the API. Make sure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-col gap-4">
          <div className="inline-flex w-fit rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
            AI Governance • LLM Security • Enterprise Architecture
          </div>

          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              AI Governance Sentinel
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Inventory, assess and secure enterprise AI agents before they
              become a risk for your information system.
            </p>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">AI agents</p>
            <p className="mt-3 text-3xl font-semibold">12</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Critical risks</p>
            <p className="mt-3 text-3xl font-semibold">3</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Sensitive connectors</p>
            <p className="mt-3 text-3xl font-semibold">8</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Approval gaps</p>
            <p className="mt-3 text-3xl font-semibold">5</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold">Risk assessment demo</h2>
                <p className="mt-2 text-slate-400">
                  Run a simulated assessment for an AI assistant connected to
                  SharePoint, Outlook and an HR API.
                </p>
              </div>

              <button
                onClick={runAssessment}
                disabled={loading}
                className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Assessing..." : "Run assessment"}
              </button>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/80 p-5">
              <h3 className="font-semibold">Agent profile</h3>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Info label="Name" value="HR Assistant" />
                <Info label="Model provider" value="OpenAI" />
                <Info label="Data sensitivity" value="Confidential" />
                <Info label="Autonomy" value="Fully autonomous" />
                <Info label="Connectors" value="SharePoint, Outlook, HR API" />
                <Info label="Human approval" value="Not required" />
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold">Assessment result</h2>

            {!result && (
              <p className="mt-4 text-slate-400">
                No assessment yet. Run the demo to calculate the AI agent risk
                score.
              </p>
            )}

            {result && (
              <div className="mt-6">
                <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-5">
                  <p className="text-sm uppercase tracking-wide text-red-200">
                    {result.risk_level} risk
                  </p>
                  <p className="mt-2 text-5xl font-bold">
                    {result.risk_score}
                    <span className="text-xl text-slate-400">/100</span>
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  {result.factors.map((factor, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-white/10 bg-slate-900/80 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold">{factor.label}</h3>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase text-slate-300">
                          {factor.severity}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-400">
                        {factor.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 font-medium text-slate-100">{value}</p>
    </div>
  );
}