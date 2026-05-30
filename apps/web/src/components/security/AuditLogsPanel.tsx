"use client";

import type { AuditLogRead } from "@/types";
import { formatDateTime } from "@/lib/formatters";
import { ActionButton } from "@/components/ui/ActionButton";
import { useI18n } from "@/i18n/I18nProvider";

export function AuditLogsPanel({
  logs,
  loading,
  onRefresh,
}: {
  logs: AuditLogRead[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const { t } = useI18n();

  return (
    <section
      id="audit"
      className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">
            {t("auditModule.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            {t("auditModule.title")}
          </h2>
          <p className="mt-3 max-w-3xl text-slate-400">
            {t("auditModule.description")}
          </p>
        </div>

        <ActionButton onClick={onRefresh} disabled={loading}>
          {loading ? t("auditModule.loading") : t("auditModule.refreshLogs")}
        </ActionButton>
      </div>

      {logs.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center text-slate-400">
          {t("auditModule.noLogs")}
        </div>
      )}

      {logs.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-[180px_120px_1fr_120px] bg-slate-900 px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
            <span>{t("auditModule.actor")}</span>
            <span>{t("auditModule.role")}</span>
            <span>{t("auditModule.action")}</span>
            <span>{t("auditModule.status")}</span>
          </div>

          <div className="divide-y divide-white/10">
            {logs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-[180px_120px_1fr_120px] px-4 py-4 text-sm text-slate-300"
              >
                <span>{log.actor}</span>
                <span className="capitalize">{log.role}</span>
                <span>
                  <span className="font-medium text-slate-100">{log.action}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {formatDateTime(log.created_at)}
                  </span>
                </span>
                <span className="capitalize">{log.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
