import type { TelemetryDetailField } from "@/lib/telemetry/detail";

export type TelemetryCategory = "security" | "info" | "inventory";

export type TelemetryLevel = "error" | "warning";

export type LogTelemetryInput = {
  category: TelemetryCategory;
  teamId?: string;
  message: string;
  action?: string;
  level?: TelemetryLevel;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  occurredAt?: Date | string;
  fields?: TelemetryDetailField[];
};

export type TaskAssignedInput = {
  teamId: string;
  taskId: string;
  title: string;
  assigneeUserIds: string[];
  actorId?: string;
};

export type EndpointFailureInput = {
  teamId?: string;
  route: string;
  status: number;
  error?: unknown;
};
