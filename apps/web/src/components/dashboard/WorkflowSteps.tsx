const steps = [
  {
    number: "01",
    title: "Define agent",
    description: "Describe the AI agent, its purpose, data exposure and connected systems.",
  },
  {
    number: "02",
    title: "Assess risk",
    description: "Calculate a governance score based on sensitivity, autonomy and permissions.",
  },
  {
    number: "03",
    title: "Test security",
    description: "Run simulated prompt injection and connector abuse scenarios.",
  },
  {
    number: "04",
    title: "Generate report",
    description: "Export an executive PDF report with findings and remediation actions.",
  },
  {
    number: "05",
    title: "Monitor",
    description: "Track audit logs, API health, database status and operational metrics.",
  },
];

export function WorkflowSteps() {
  return (
    <section className="grid gap-4 lg:grid-cols-5">
      {steps.map((step) => (
        <div
          key={step.number}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
            {step.number}
          </span>
          <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{step.description}</p>
        </div>
      ))}
    </section>
  );
}
