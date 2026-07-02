import { NextResponse } from "next/server";

import {
  isGitHubEventId,
  normalizeGitHubEvents,
  preferencesEqual,
  type NotificationPreferences,
} from "@/lib/notifications/preferences";
import {
  getNotificationSettings,
  upsertNotificationSettings,
} from "@/lib/notifications/settings.server";
import { createClient } from "@/lib/supabase/server";

type UpdateNotificationSettingsPayload = {
  enableDiscordPushNotifs?: boolean;
  githubNotifsEnabled?: boolean;
  githubEvents?: string[];
  fusionNotifsEnabled?: boolean;
};

function parseUpdatePayload(
  body: UpdateNotificationSettingsPayload,
  current: NotificationPreferences,
):
  | { ok: true; preferences: NotificationPreferences }
  | { ok: false; error: string } {
  const enableDiscordPushNotifs =
    typeof body.enableDiscordPushNotifs === "boolean"
      ? body.enableDiscordPushNotifs
      : current.enableDiscordPushNotifs;

  const githubNotifsEnabled =
    typeof body.githubNotifsEnabled === "boolean"
      ? body.githubNotifsEnabled
      : current.githubNotifsEnabled;

  const fusionNotifsEnabled =
    typeof body.fusionNotifsEnabled === "boolean"
      ? body.fusionNotifsEnabled
      : current.fusionNotifsEnabled;

  let githubEvents = current.githubEvents;

  if (body.githubEvents !== undefined) {
    if (!Array.isArray(body.githubEvents)) {
      return { ok: false, error: "githubEvents must be an array." };
    }

    if (!body.githubEvents.every((event) => typeof event === "string")) {
      return { ok: false, error: "Each GitHub event must be a string." };
    }

    if (!body.githubEvents.every(isGitHubEventId)) {
      return { ok: false, error: "One or more GitHub events are invalid." };
    }

    githubEvents = normalizeGitHubEvents(body.githubEvents);
  }

  if (githubNotifsEnabled && githubEvents.length === 0) {
    return {
      ok: false,
      error: "Select at least one GitHub event when GitHub notifications are enabled.",
    };
  }

  return {
    ok: true,
    preferences: {
      enableDiscordPushNotifs,
      githubNotifsEnabled,
      githubEvents,
      fusionNotifsEnabled,
    },
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const settings = await getNotificationSettings(user.id);

  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: UpdateNotificationSettingsPayload;

  try {
    body = (await request.json()) as UpdateNotificationSettingsPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const current = await getNotificationSettings(user.id);
  const parsed = parseUpdatePayload(body, current);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (preferencesEqual(parsed.preferences, current)) {
    return NextResponse.json(
      { error: "No changes to save." },
      { status: 400 },
    );
  }

  const settings = await upsertNotificationSettings(user.id, parsed.preferences);

  return NextResponse.json({
    settings,
    message: "Notification preferences updated.",
  });
}
