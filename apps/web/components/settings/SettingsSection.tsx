import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  variant?: "default" | "danger";
};

export function SettingsSection({
  title,
  description,
  children,
  variant = "default",
}: SettingsSectionProps) {
  const isDanger = variant === "danger";

  return (
    <section
      className={`rounded-2xl bg-[#090e18]/80 border p-6 shadow-md backdrop-blur-sm relative overflow-hidden ${
        isDanger
          ? "border-red-500/20 shadow-red-500/5"
          : "border-slate-900 shadow-black/20"
      }`}
    >
      {isDanger ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent"
        />
      ) : null}

      <div className="border-b border-slate-900/80 pb-4 mb-5">
        <h2
          className={`text-[10.5px] font-black uppercase tracking-widest ${
            isDanger ? "text-red-400" : "text-slate-400"
          }`}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 text-xs font-medium text-slate-500 leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>

      {children}
    </section>
  );
}
