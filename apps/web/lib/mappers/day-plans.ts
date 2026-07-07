import type {
  DayPlanType as PrismaDayPlanType,
  TeamDayPlan as PrismaTeamDayPlan,
} from "@stlvex/database/types";

import type { DayPlanType, TeamDayPlan } from "@/lib/types/team";

function formatDate(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mapDayPlanType(type: PrismaDayPlanType): DayPlanType {
  switch (type) {
    case "BUILD":
      return "build";
    case "CODING":
      return "coding";
    case "TESTING":
      return "testing";
    default:
      return "build";
  }
}

export function toPrismaDayPlanType(type: DayPlanType): PrismaDayPlanType {
  switch (type) {
    case "build":
      return "BUILD";
    case "coding":
      return "CODING";
    case "testing":
      return "TESTING";
  }
}

export function toUiDayPlanTypeFromApi(type: string): DayPlanType | null {
  const normalized = type.trim().toLowerCase();

  if (normalized === "build" || normalized === "coding" || normalized === "testing") {
    return normalized;
  }

  return null;
}

export function toTeamDayPlan(plan: PrismaTeamDayPlan): TeamDayPlan {
  return {
    id: plan.id,
    date: formatDate(plan.date),
    type: mapDayPlanType(plan.type),
  };
}

export function toTeamDayPlans(plans: PrismaTeamDayPlan[]): TeamDayPlan[] {
  return plans.map(toTeamDayPlan);
}
