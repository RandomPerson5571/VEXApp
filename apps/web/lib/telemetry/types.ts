export type TelemetryCategory = "security" | "info" | "inventory";

export type TelemetryLevel = "error" | "warning";

export type LogTelemetryInput = {
  category: TelemetryCategory;
  teamId: string;
  message: string;
  action?: string;
  level?: TelemetryLevel;
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
