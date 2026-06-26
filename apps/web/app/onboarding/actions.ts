"use server";

import { Prisma, prisma } from "@stlvex/database";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  clearInviteCookie,
  INVITE_COOKIE,
  InviteExhaustedError,
  InviteExpiredError,
  InviteNotFoundError,
  INVITE_REQUIRED_MESSAGE,
  incrementInviteUse,
  lockInviteForUse,
} from "@/lib/auth/invite";
import {
  confirmProfileVerification,
  getDiscordIdFromAuthUser,
  getDiscordUsernameFromAuthUser,
  isDiscordAuthUser,
} from "@/lib/auth/identity";
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

  const cookieStore = await cookies();
  const inviteCode = cookieStore.get(INVITE_COOKIE)?.value?.trim();

  if (!inviteCode) {
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
    await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { id: user.id },
        select: { id: true },
      });

      if (existing) {
        return existing;
      }

      const invite = await lockInviteForUse(tx, inviteCode);
      const discordId = isDiscordAuthUser(user)
        ? getDiscordIdFromAuthUser(user)
        : null;
      const useDiscordVerify = discordId !== null;
      const emailVerified = Boolean(user.email_confirmed_at);

      const created = await tx.user.create({
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
          verificationMethod: useDiscordVerify
            ? "DISCORD"
            : emailVerified
              ? "EMAIL"
              : "UNVERIFIED",
          isVerified: useDiscordVerify || emailVerified,
        },
      });

      await incrementInviteUse(tx, invite.id);

      return created;
    });
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
      error instanceof InviteExpiredError
    ) {
      return { error: error.message };
    }

    throw error;
  }

  await confirmProfileVerification(user);
  await clearInviteCookie();

  redirect("/dashboard");
}
