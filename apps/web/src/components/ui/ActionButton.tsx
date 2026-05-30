import type { ReactNode } from "react";

type Variant = "default" | "purple" | "green" | "white" | "solid" | "danger";

const classNameByVariant: Record<Variant, string> = {
  default:
    "border border-cyan-400/40 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20",
  purple:
    "border border-purple-400/40 bg-purple-400/10 text-purple-100 hover:bg-purple-400/20",
  green:
    "border border-emerald-400/40 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20",
  white: "bg-white text-slate-950 hover:bg-slate-200",
  solid: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
  danger:
    "border border-red-400/40 bg-red-400/10 text-red-100 hover:bg-red-400/20",
};

export function ActionButton({
  children,
  onClick,
  disabled,
  variant = "default",
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: Variant;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[110px] whitespace-nowrap rounded-xl px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${classNameByVariant[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
