import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import {
  clearTeamDayPlan,
  getTeamDayPlans,
  setTeamDayPlan,
} from "@/lib/queries/day-plans.server";
import { toUiDayPlanTypeFromApi } from "@/lib/mappers/day-plans";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type SetDayPlanRequestBody = {
  date?: string;
  type?: string;
};

function parsePlanDate(date: string | undefined): string | null {
  const value = date?.trim();

  if (!value || !DATE_PATTERN.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    return null;
  }

  return value;
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!currentUser.profile.teamId) {
    return NextResponse.json([]);
  }

  const plans = await getTeamDayPlans(currentUser.profile.teamId);
  return NextResponse.json(plans);
}

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;

  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to set day plans." },
      { status: 400 },
    );
  }

  let body: SetDayPlanRequestBody;

  try {
    body = (await request.json()) as SetDayPlanRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const date = parsePlanDate(body.date);
  const type = body.type ? toUiDayPlanTypeFromApi(body.type) : null;

  if (!date) {
    return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
  }

  if (!type) {
    return NextResponse.json({ error: "Invalid day plan type." }, { status: 400 });
  }

  try {
    const plan = await setTeamDayPlan({
      teamId,
      date,
      type,
      createdBy: currentUser.profile.id,
    });

    return NextResponse.json(plan);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to set day plan.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;

  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to clear day plans." },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const date = parsePlanDate(searchParams.get("date") ?? undefined);

  if (!date) {
    return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
  }

  try {
    await clearTeamDayPlan(teamId, date);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to clear day plan.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
