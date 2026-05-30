import { LanguageSelector } from "@/i18n/LanguageSelector";
import { useI18n } from "@/i18n/I18nProvider";
import { languageLabels } from "@/i18n/translations";

export function SettingsPanel() {
  const { language, t } = useI18n();

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
      <p className="text-sm uppercase tracking-[0.24em] text-purple-300">
        {t("settings.eyebrow")}
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-white">
        {t("settings.title")}
      </h2>
      <p className="mt-3 max-w-4xl text-slate-400">
        {t("settings.description")}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
          <p className="text-sm uppercase tracking-wide text-cyan-200">
            {t("settings.languageTitle")}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {t("settings.languageDescription")}
          </p>

          <div className="mt-5">
            <LanguageSelector compact />
          </div>

          <p className="mt-5 text-sm text-slate-300">
            {t("settings.currentLanguage")}{" "}
            <span className="font-semibold text-white">
              {languageLabels[language]}
            </span>
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <h3 className="text-xl font-semibold text-white">
            {t("settings.roadmapTitle")}
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {t("settings.roadmapDescription")}
          </p>
        </div>
      </div>
    </section>
  );
}
