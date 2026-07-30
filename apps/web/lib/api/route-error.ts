import { NextResponse } from "next/server";

import { logEndpointFailure } from "@/lib/telemetry/dispatch";

export function apiErrorResponse(
  error: unknown,
  route: string,
  teamId?: string,
  fallbackMessage = "Request failed.",
): NextResponse {
  const message = error instanceof Error ? error.message : fallbackMessage;
  const status = message === "Forbidden." ? 403 : message === "Task not found." ? 404 : 400;

  if (status >= 500) {
    logEndpointFailure({ teamId, route, status, error });
  }

  return NextResponse.json({ error: message }, { status });
}

export function apiServerErrorResponse(
  error: unknown,
  route: string,
  teamId?: string,
): NextResponse {
  logEndpointFailure({
    teamId,
    route,
    status: 500,
    error,
  });

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";
  return NextResponse.json({ error: message }, { status: 500 });
}
