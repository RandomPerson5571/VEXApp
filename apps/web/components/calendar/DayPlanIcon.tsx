import { Code2, FlaskConical, Wrench, type LucideIcon } from "lucide-react";
import type { DayPlanType } from "@/lib/types/team";
import { getDayPlanStyle } from "@/lib/utils/calendar";

const DAY_PLAN_ICONS: Record<DayPlanType, LucideIcon> = {
  build: Wrench,
  coding: Code2,
  testing: FlaskConical,
};

export function DayPlanIcon({
  type,
  className = "h-3 w-3",
  decorative = false,
}: {
  type: DayPlanType;
  className?: string;
  decorative?: boolean;
}) {
  const Icon = DAY_PLAN_ICONS[type];
  const style = getDayPlanStyle(type);

  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : style.label}
      aria-hidden={decorative ? true : undefined}
      title={decorative ? undefined : style.label}
      className={`inline-flex flex-shrink-0 ${style.icon}`}
    >
      <Icon className={className} aria-hidden />
    </span>
  );
}
