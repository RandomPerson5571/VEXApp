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
}: {
  type: DayPlanType;
  className?: string;
}) {
  const Icon = DAY_PLAN_ICONS[type];
  const style = getDayPlanStyle(type);

  return (
    <span
      role="img"
      aria-label={style.label}
      title={style.label}
      className={`inline-flex flex-shrink-0 ${style.icon}`}
    >
      <Icon className={className} aria-hidden />
    </span>
  );
}
