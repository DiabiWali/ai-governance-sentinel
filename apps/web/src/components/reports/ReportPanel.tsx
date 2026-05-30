import type { RiskReportResponse } from "@/types";
import { formatDateTime } from "@/lib/formatters";
import { riskTone } from "@/lib/risk";
import { ActionButton } from "@/components/ui/ActionButton";

export function ReportPanel({
  report,
  loading,
  onGenerate,
  onDownloadMarkdown,
  onDownloadPdf,
}: {
  report: RiskReportResponse | null;
  loading: boolean;
  onGenerate: () => void;
  onDownloadMarkdown: () => void;
  onDownloadPdf: () => void;
}) {
  return (
    <section
      id="reports"
      className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">
            Reporting
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            Governance report export
          </h2>
          <p className="mt-3 max-w-3xl text-slate-400">
            Generate an executive and technical report combining profile, risk score,
            prompt injection findings and remediation plan.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <ActionButton onClick={onGenerate} disabled={loading} variant="green">
            {loading ? "Generating..." : "Generate report"}
          </ActionButton>
          <ActionButton onClick={onDownloadMarkdown} disabled={!report} variant="green">
            Markdown
          </ActionButton>
          <ActionButton onClick={onDownloadPdf} disabled={loading} variant="white">
            PDF
          </ActionButton>
        </div>
      </div>

      {!report && (
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center text-slate-400">
          No report generated yet.
        </div>
      )}

      {report && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className={`rounded-3xl border p-5 ${riskTone(report.risk_assessment.risk_level)}`}>
            <p className="text-sm uppercase tracking-wide">Generated report</p>
            <h3 className="mt-2 text-2xl font-bold">{report.agent_name}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {report.executive_summary}
            </p>

            <div className="mt-5 grid gap-3">
              <MiniInfo label="Risk score" value={`${report.risk_assessment.risk_score}/100`} />
              <MiniInfo label="Risk level" value={report.risk_assessment.risk_level} />
              <MiniInfo label="Failed tests" value={String(report.prompt_injection_tests.failed_tests)} />
              <MiniInfo label="Generated" value={formatDateTime(report.generated_at)} />
            </div>
          </div>

          <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-3xl border border-white/10 bg-black/30 p-5 text-sm leading-6 text-slate-300">
            {report.markdown_report}
          </pre>
        </div>
      )}
    </section>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-medium text-white">{value}</p>
    </div>
  );
}
