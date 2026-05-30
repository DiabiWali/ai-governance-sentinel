import { useI18n } from "@/i18n/I18nProvider";

const steps = [
  {
    number: "01",
    titleKey: "workflow.defineTitle",
    descriptionKey: "workflow.defineDescription",
  },
  {
    number: "02",
    titleKey: "workflow.assessTitle",
    descriptionKey: "workflow.assessDescription",
  },
  {
    number: "03",
    titleKey: "workflow.testTitle",
    descriptionKey: "workflow.testDescription",
  },
  {
    number: "04",
    titleKey: "workflow.reportTitle",
    descriptionKey: "workflow.reportDescription",
  },
  {
    number: "05",
    titleKey: "workflow.monitorTitle",
    descriptionKey: "workflow.monitorDescription",
  },
];

export function WorkflowSteps() {
  const { t } = useI18n();

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
          <h3 className="mt-4 text-lg font-semibold text-white">
            {t(step.titleKey)}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {t(step.descriptionKey)}
          </p>
        </div>
      ))}
    </section>
  );
}
