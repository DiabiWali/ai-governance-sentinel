import type { DashboardTab } from "@/components/layout/TabNavigation";
import { LanguageSelector } from "@/i18n/LanguageSelector";
import { useI18n } from "@/i18n/I18nProvider";

const navItems: Array<{
  key: DashboardTab;
  labelKey: string;
  descriptionKey: string;
  accent: string;
}> = [
  {
    key: "overview",
    labelKey: "sidebar.overview",
    descriptionKey: "sidebar.overviewDescription",
    accent: "bg-cyan-400",
  },
  {
    key: "discovery",
    labelKey: "sidebar.discovery",
    descriptionKey: "sidebar.discoveryDescription",
    accent: "bg-fuchsia-400",
  },
  {
    key: "agents",
    labelKey: "sidebar.agents",
    descriptionKey: "sidebar.agentsDescription",
    accent: "bg-sky-400",
  },
  {
    key: "assessment",
    labelKey: "sidebar.assessment",
    descriptionKey: "sidebar.assessmentDescription",
    accent: "bg-blue-400",
  },
  {
    key: "security",
    labelKey: "sidebar.security",
    descriptionKey: "sidebar.securityDescription",
    accent: "bg-purple-400",
  },
  {
    key: "compliance",
    labelKey: "sidebar.compliance",
    descriptionKey: "sidebar.complianceDescription",
    accent: "bg-emerald-400",
  },
  {
    key: "reports",
    labelKey: "sidebar.reports",
    descriptionKey: "sidebar.reportsDescription",
    accent: "bg-teal-400",
  },
  {
    key: "monitoring",
    labelKey: "sidebar.monitoring",
    descriptionKey: "sidebar.monitoringDescription",
    accent: "bg-lime-400",
  },
  {
    key: "audit",
    labelKey: "sidebar.audit",
    descriptionKey: "sidebar.auditDescription",
    accent: "bg-orange-400",
  },
  {
    key: "settings",
    labelKey: "sidebar.settings",
    descriptionKey: "sidebar.settingsDescription",
    accent: "bg-pink-400",
  },
];

export function AppSidebar({
  activeTab,
  onChange,
}: {
  activeTab: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}) {
  const { t } = useI18n();

  return (
    <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
      <div className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-xl">
        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-sm font-bold text-cyan-100">
              AG
            </div>
            <div>
              <p className="font-semibold text-white">{t("sidebar.productName")}</p>
              <p className="text-xs text-slate-400">{t("sidebar.workspace")}</p>
            </div>
          </div>
        </div>

        <nav className="mt-5 grid gap-2">
          {navItems.map((item) => {
            const active = activeTab === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChange(item.key)}
                className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-cyan-400/40 bg-cyan-400/10 text-white shadow-lg shadow-cyan-950/30"
                    : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${item.accent} ${
                    active ? "opacity-100" : "opacity-40 group-hover:opacity-80"
                  }`}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {t(item.labelKey)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs opacity-70">
                    {t(item.descriptionKey)}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-5">
          <LanguageSelector />
        </div>

        <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {t("sidebar.demoMode")}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {t("sidebar.demoDescription")}
          </p>
        </div>
      </div>
    </aside>
  );
}
