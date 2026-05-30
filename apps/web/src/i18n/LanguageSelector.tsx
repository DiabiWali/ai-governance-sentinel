"use client";

import { languageLabels, type Language } from "@/i18n/translations";
import { useI18n } from "@/i18n/I18nProvider";

export function LanguageSelector({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { language, setLanguage } = useI18n();

  return (
    <div className={compact ? "" : "rounded-2xl border border-white/10 bg-white/[0.04] p-4"}>
      {!compact && (
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-500">
          Language
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(languageLabels) as Language[]).map((item) => {
          const active = language === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => setLanguage(item)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                active
                  ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-100"
                  : "border-white/10 bg-slate-900/70 text-slate-400 hover:text-white"
              }`}
            >
              {languageLabels[item]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
