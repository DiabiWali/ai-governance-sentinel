export function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${
        checked
          ? "border-cyan-400 bg-cyan-400/10"
          : "border-white/10 bg-slate-900 hover:border-white/25"
      }`}
    >
      <span>
        <span className="block font-medium text-slate-100">{label}</span>
        {description && (
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            {description}
          </span>
        )}
      </span>

      <span
        className={`flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition ${
          checked ? "bg-cyan-400" : "bg-slate-700"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
