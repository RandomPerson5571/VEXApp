import { Prisma, prisma } from "@stlvex/database";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestClientIp } from "@/lib/security/client-ip";
import {
  ACCOUNT_DELETE_RATE_LIMITS,
  consumeRateLimit,
  PROFILE_UPDATE_RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 100;

type UpdateProfilePayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userLimit = await consumeRateLimit(
    "profile-update:user",
    user.id,
    PROFILE_UPDATE_RATE_LIMITS.user,
  );

  if (!userLimit.allowed) {
    return rateLimitExceededResponse(userLimit);
  }

  const clientIp = getRequestClientIp(request);
  const ipLimit = await consumeRateLimit(
    "profile-update:ip",
    clientIp,
    PROFILE_UPDATE_RATE_LIMITS.ip,
  );

  if (!ipLimit.allowed) {
    return rateLimitExceededResponse(ipLimit);
  }

  let body: UpdateProfilePayload;

  try {
    body = (await request.json()) as UpdateProfilePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const email = body.email?.trim();

  if (!firstName || !lastName || !email) {
    return NextResponse.json(
      { error: "First name, last name, and email are required." },
      { status: 400 },
    );
  }

  if (firstName.length > MAX_NAME_LENGTH || lastName.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: "Names must be 100 characters or fewer." },
      { status: 400 },
    );
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const currentProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  if (!currentProfile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const normalizedEmail = normalizeEmail(email);
  const currentEmail = normalizeEmail(currentProfile.email);
  const emailChanged = normalizedEmail !== currentEmail;

  if (
    firstName === currentProfile.firstName &&
    lastName === currentProfile.lastName &&
    !emailChanged
  ) {
    return NextResponse.json(
      { error: "No changes to save." },
      { status: 400 },
    );
  }

  if (emailChanged) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingEmail && existingEmail.id !== user.id) {
      return NextResponse.json(
        { error: "That email address is already in use." },
        { status: 409 },
      );
    }

    const { error: authUpdateError } = await supabase.auth.updateUser({
      email: normalizedEmail,
    });

    if (authUpdateError) {
      return NextResponse.json(
        { error: authUpdateError.message },
        { status: 400 },
      );
    }
  }

  try {
    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        email: normalizedEmail,
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    return NextResponse.json({
      profile: updatedProfile,
      message: emailChanged
        ? "Profile updated. Check your inbox to confirm your new email address."
        : "Profile updated successfully.",
      emailConfirmationRequired: emailChanged,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "That email address is already in use." },
        { status: 409 },
      );
    }

    throw error;
  }
}


export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // 1. Rate Limits
  const userLimit = await consumeRateLimit(
    "account-delete:user",
    user.id,
    ACCOUNT_DELETE_RATE_LIMITS.user,
  );
  if (!userLimit.allowed) return rateLimitExceededResponse(userLimit);

  const clientIp = getRequestClientIp(request);
  const ipLimit = await consumeRateLimit(
    "account-delete:ip",
    clientIp,
    ACCOUNT_DELETE_RATE_LIMITS.ip,
  );
  if (!ipLimit.allowed) return rateLimitExceededResponse(ipLimit);

  // 2. Validate Profile & Last Admin Rule
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, isAdmin: true },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  if (profile.isAdmin) {
    const adminCount = await prisma.user.count({
      where: { isAdmin: true },
    });

    if (adminCount <= 1) {
      return NextResponse.json(
        {
          error: "You are the only admin. Promote another admin before deleting your account.",
        },
        { status: 409 },
      );
    }
  }

  // 3. Clear the active session token BEFORE removing the auth identity
  try {
    await supabase.auth.signOut();
  } catch (signOutError) {
    console.error("Sign-out warning:", signOutError);
  }

  // 4. Delete the Supabase auth user; DB trigger cascades to public."User"
  const adminClient = createAdminClient();
  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(
    user.id,
  );

  if (authDeleteError) {
    console.error("Supabase Admin Auth deletion failed:", authDeleteError);
    return NextResponse.json(
      { error: "Failed to delete your account. Please try again or contact support." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: "Account deleted successfully.",
  });
}