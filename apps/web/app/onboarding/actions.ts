"use server";

import { Prisma, prisma } from "@stlvex/database";
import { redirect } from "next/navigation";

import {
  clearInviteCookie,
  consumeInvite,
  getInviteInvalidReasonForAuthUser,
  InviteExhaustedError,
  InviteExpiredError,
  InviteNotFoundError,
  InviteReservedError,
  INVITE_REQUIRED_MESSAGE,
  resolveInviteForAuthUser,
} from "@/lib/auth/invite";
import {
  confirmProfileVerification,
  getDiscordIdFromAuthUser,
  getDiscordUsernameFromAuthUser,
  isDiscordAuthUser,
} from "@/lib/auth/identity";
import { logTelemetry } from "@/lib/telemetry/dispatch";
import { telemetryFields } from "@/lib/telemetry/detail";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = {
  error: string;
} | null;

function splitName(fullName: string | undefined, email: string) {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/);
    return {
      firstName: parts[0] ?? email.split("@")[0] ?? "User",
      lastName: parts.slice(1).join(" ") || "Member",
    };
  }

  const localPart = email.split("@")[0] ?? "user";
  return {
    firstName: localPart,
    lastName: "Member",
  };
}

export async function completeOnboarding(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to finish onboarding." };
  }

  const email = user.email;
  if (!email) {
    return { error: "Your account is missing an email address." };
  }

  const discordAuth = isDiscordAuthUser(user);
  const emailVerified = Boolean(user.email_confirmed_at);

  if (!discordAuth && !emailVerified) {
    return {
      error:
        "Your email address has not been verified yet. Check your inbox or continue with Discord.",
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true },
  });

  if (existingUser) {
    await confirmProfileVerification(user);
    await clearInviteCookie();
    redirect("/dashboard");
  }

  const { invite } = await resolveInviteForAuthUser(user);

  if (!invite) {
    const reason = await getInviteInvalidReasonForAuthUser(user);

    if (reason === "expired") {
      return { error: new InviteExpiredError().message };
    }

    if (reason === "exhausted") {
      return { error: new InviteExhaustedError().message };
    }

    if (reason === "reserved") {
      return { error: new InviteReservedError().message };
    }

    return { error: INVITE_REQUIRED_MESSAGE };
  }

  const firstNameInput = formData.get("firstName");
  const lastNameInput = formData.get("lastName");
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : undefined;
  const fallbackName = splitName(metadataName, email);
  const firstName =
    typeof firstNameInput === "string" && firstNameInput.trim()
      ? firstNameInput.trim()
      : fallbackName.firstName;
  const lastName =
    typeof lastNameInput === "string" && lastNameInput.trim()
      ? lastNameInput.trim()
      : fallbackName.lastName;

  try {
    const createdUser = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { id: user.id },
        select: { id: true },
      });

      if (existing) {
        return null;
      }

      await consumeInvite(tx, invite.id, user.id);

      const discordId = discordAuth ? getDiscordIdFromAuthUser(user) : null;

      return tx.user.create({
        data: {
          id: user.id,
          email,
          firstName,
          lastName,
          teamId: invite.teamId,
          discordId,
          ...(discordId
            ? {
                discordAccount: {
                  create: {
                    discordId,
                    discordUsername: getDiscordUsernameFromAuthUser(user),
                  },
                },
              }
            : {}),
          verificationMethod: discordAuth ? "DISCORD" : "EMAIL",
          isVerified: true,
        },
      });
    });

    if (createdUser) {
      logTelemetry({
        category: "security",
        teamId: invite.teamId,
        message: `New account: **${firstName} ${lastName}** (${email})`,
        action: "user.signup",
        entityType: "user",
        entityId: createdUser.id,
        actorId: createdUser.id,
        occurredAt: createdUser.createdAt,
        fields: telemetryFields({
          Email: email,
          Name: `${firstName} ${lastName}`,
          "Verification method": discordAuth ? "Discord" : "Email",
          "Discord ID": createdUser.discordId ?? undefined,
          "Invite ID": invite.id,
        }),
      });
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error:
          "That Discord account is already linked to another user. Sign in with the account that owns it, or ask a team lead for help.",
      };
    }

    if (
      error instanceof InviteNotFoundError ||
      error instanceof InviteExhaustedError ||
      error instanceof InviteExpiredError ||
      error instanceof InviteReservedError
    ) {
      return { error: error.message };
    }

    throw error;
  }

  await confirmProfileVerification(user);
  await clearInviteCookie();

  redirect("/dashboard");
}
