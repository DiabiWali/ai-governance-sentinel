import type { AgentRead } from "@/types";
import { humanizeEnum } from "@/lib/formatters";
import { riskBadge } from "@/lib/risk";
import { ActionButton } from "@/components/ui/ActionButton";

export function AgentInventory({
  agents,
  searchQuery,
  riskFilter,
  sortMode,
  editingAgentId,
  deletingAgentId,
  inventoryLoading,
  onSearchChange,
  onRiskFilterChange,
  onSortModeChange,
  onRefresh,
  onEdit,
  onDelete,
  onRunTests,
  onGenerateReport,
  onDownloadPdf,
  onCompliance,
}: {
  agents: AgentRead[];
  searchQuery: string;
  riskFilter: string;
  sortMode: string;
  editingAgentId: number | null;
  deletingAgentId: number | null;
  inventoryLoading: boolean;
  onSearchChange: (value: string) => void;
  onRiskFilterChange: (value: string) => void;
  onSortModeChange: (value: string) => void;
  onRefresh: () => void;
  onEdit: (agent: AgentRead) => void;
  onDelete: (agent: AgentRead) => void;
  onRunTests: (agentId: number) => void;
  onGenerateReport: (agentId: number) => void;
  onDownloadPdf: (agentId: number, agentName: string) => void;
  onCompliance: (agentId: number) => void;
}) {
  return (
    <section
      id="inventory"
      className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">
            Agent inventory
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            Manage saved AI agents
          </h2>
          <p className="mt-3 max-w-3xl text-slate-400">
            Search, filter, edit, delete, test, map compliance and report on persistent AI agents.
          </p>
        </div>

        <ActionButton onClick={onRefresh} disabled={inventoryLoading}>
          {inventoryLoading ? "Refreshing..." : "Refresh inventory"}
        </ActionButton>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_180px_200px]">
        <input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
          placeholder="Search by name, purpose, provider or connector..."
        />

        <select
          value={riskFilter}
          onChange={(event) => onRiskFilterChange(event.target.value)}
          className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
        >
          <option value="all">All risks</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="no_assessment">No assessment</option>
        </select>

        <select
          value={sortMode}
          onChange={(event) => onSortModeChange(event.target.value)}
          className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
        >
          <option value="updated_desc">Recently updated</option>
          <option value="risk_desc">Highest risk</option>
          <option value="risk_asc">Lowest risk</option>
          <option value="name_asc">Name A-Z</option>
        </select>
      </div>

      <div className="mt-6">
        {agents.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center text-slate-400">
            No agents match the current filters.
          </div>
        )}

        {agents.length > 0 && (
          <div className="grid gap-4 xl:grid-cols-2">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isEditing={editingAgentId === agent.id}
                isDeleting={deletingAgentId === agent.id}
                onEdit={() => onEdit(agent)}
                onDelete={() => onDelete(agent)}
                onRunTests={() => onRunTests(agent.id)}
                onGenerateReport={() => onGenerateReport(agent.id)}
                onDownloadPdf={() => onDownloadPdf(agent.id, agent.name)}
                onCompliance={() => onCompliance(agent.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AgentCard({
  agent,
  isEditing,
  isDeleting,
  onEdit,
  onDelete,
  onRunTests,
  onGenerateReport,
  onDownloadPdf,
  onCompliance,
}: {
  agent: AgentRead;
  isEditing: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRunTests: () => void;
  onGenerateReport: () => void;
  onDownloadPdf: () => void;
  onCompliance: () => void;
}) {
  const assessment = agent.latest_assessment;

  return (
    <article
      className={`rounded-3xl border p-5 transition ${
        isEditing
          ? "border-cyan-400/50 bg-cyan-400/10"
          : "border-white/10 bg-slate-900/70 hover:border-white/20"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
          <p className="mt-1 text-sm text-slate-400">{agent.model_provider}</p>
        </div>

        {assessment && (
          <span
            className={`rounded-full border px-3 py-1 text-xs uppercase ${riskBadge(
              assessment.risk_level
            )}`}
          >
            {assessment.risk_level} • {assessment.risk_score}/100
          </span>
        )}
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">{agent.purpose}</p>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <MiniInfo label="Sensitivity" value={humanizeEnum(agent.data_sensitivity)} />
        <MiniInfo label="Autonomy" value={humanizeEnum(agent.autonomy_level)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {agent.connectors.length === 0 && (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
            no connector
          </span>
        )}

        {agent.connectors.map((connector) => (
          <span
            key={`${agent.id}-${connector}`}
            className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300"
          >
            {connector}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <button onClick={onEdit} className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 font-semibold text-cyan-100 transition hover:bg-cyan-400/20">
          Edit
        </button>
        <button onClick={onRunTests} className="rounded-xl border border-purple-400/30 bg-purple-400/10 px-4 py-3 font-semibold text-purple-100 transition hover:bg-purple-400/20">
          Tests
        </button>
        <button onClick={onCompliance} className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 font-semibold text-emerald-100 transition hover:bg-emerald-400/20">
          Compliance
        </button>
        <button onClick={onGenerateReport} className="rounded-xl border border-teal-400/30 bg-teal-400/10 px-4 py-3 font-semibold text-teal-100 transition hover:bg-teal-400/20">
          Report
        </button>
        <button onClick={onDownloadPdf} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20">
          PDF
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 font-semibold text-red-100 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </article>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-medium capitalize text-slate-100">{value}</p>
    </div>
  );
}
