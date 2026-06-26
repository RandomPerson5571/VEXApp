import { Prisma, prisma } from "@stlvex/database";
import { NextResponse } from "next/server";

import { getSiteUrl } from "@/app/(auth)/lib/site-url";
import { getDiscordIdFromAuthUser, getDiscordUsernameFromAuthUser } from "@/lib/auth/identity";
import {
  getInviteByCode,
  InviteExhaustedError,
  InviteExpiredError,
  InviteNotFoundError,
  incrementInviteUse,
  lockInviteForUse,
} from "@/lib/auth/invite";

import { createClient } from "@/lib/supabase/server";

import { getRequestClientIp } from "@/lib/security/client-ip";

import {

  consumeRateLimit,

  REGISTER_INVITE_RATE_LIMITS,

} from "@/lib/security/rate-limit";

import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";

import { verifyTurnstileToken } from "@/lib/security/turnstile";



type RegisterInvitePayload = {

  inviteCode?: string;

  email?: string;

  firstName?: string;

  lastName?: string;

  password?: string;

  useDiscordVerify?: boolean;

  captchaToken?: string;

};



function parsePayload(body: RegisterInvitePayload) {

  const inviteCode = body.inviteCode?.trim();

  const email = body.email?.trim().toLowerCase();

  const firstName = body.firstName?.trim();

  const lastName = body.lastName?.trim();

  const password = body.password;

  const useDiscordVerify = body.useDiscordVerify === true;

  const captchaToken = body.captchaToken?.trim();



  if (!inviteCode || !email || !firstName || !lastName) {

    return {

      error: "inviteCode, email, firstName, and lastName are required.",

    } as const;

  }



  if (!useDiscordVerify && (!password || password.length < 8)) {

    return {

      error: "A password of at least 8 characters is required.",

    } as const;

  }



  return {

    inviteCode,

    email,

    firstName,

    lastName,

    password,

    useDiscordVerify,

    captchaToken,

  } as const;

}



export async function POST(request: Request) {

  let body: RegisterInvitePayload;



  try {

    body = (await request.json()) as RegisterInvitePayload;

  } catch {

    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  }



  const parsed = parsePayload(body);



  if ("error" in parsed) {

    return NextResponse.json({ error: parsed.error }, { status: 400 });

  }



  const {

    inviteCode,

    email,

    firstName,

    lastName,

    password,

    useDiscordVerify,

    captchaToken,

  } = parsed;



  const clientIp = getRequestClientIp(request);



  const ipLimit = await consumeRateLimit(

    "register-invite:ip",

    clientIp,

    REGISTER_INVITE_RATE_LIMITS.ip,

  );



  if (!ipLimit.allowed) {

    return rateLimitExceededResponse(ipLimit);

  }



  const inviteLimit = await consumeRateLimit(

    "register-invite:code",

    inviteCode,

    REGISTER_INVITE_RATE_LIMITS.inviteCode,

  );



  if (!inviteLimit.allowed) {

    return rateLimitExceededResponse(inviteLimit);

  }



  const captchaResult = await verifyTurnstileToken(request, captchaToken);



  if (!captchaResult.ok) {

    return NextResponse.json({ error: captchaResult.error }, { status: 400 });

  }



  const invite = await getInviteByCode(inviteCode);



  if (!invite) {

    return NextResponse.json(

      { error: "Invite code is invalid or expired." },

      { status: 404 },

    );

  }



  const supabase = await createClient();

  let authUserId: string;

  let verifiedDiscordId: string | undefined;
  let discordAuthUser: Awaited<
    ReturnType<typeof supabase.auth.getUser>
  >["data"]["user"];



  if (useDiscordVerify) {

    const {

      data: { user },

    } = await supabase.auth.getUser();



    if (!user) {

      return NextResponse.json(

        { error: "Discord verification requires an active sign-in session." },

        { status: 401 },

      );

    }



    if (user.email?.toLowerCase() !== email) {

      return NextResponse.json(

        { error: "Email does not match the authenticated Discord session." },

        { status: 400 },

      );

    }



    const discordId = getDiscordIdFromAuthUser(user);



    if (!discordId) {

      return NextResponse.json(

        { error: "Discord verification requires a linked Discord identity." },

        { status: 400 },

      );

    }



    verifiedDiscordId = discordId;

    authUserId = user.id;
    discordAuthUser = user;

  } else {

    const siteUrl = await getSiteUrl();

    const { data, error } = await supabase.auth.signUp({

      email,

      password: password!,

      options: {

        emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/dashboard")}`,

      },

    });



    if (error) {

      return NextResponse.json({ error: error.message }, { status: 400 });

    }



    if (!data.user) {

      return NextResponse.json(

        { error: "Account creation did not return a user." },

        { status: 500 },

      );

    }



    authUserId = data.user.id;

  }



  try {

    const profile = await prisma.$transaction(async (tx) => {
      const lockedInvite = await lockInviteForUse(tx, inviteCode);

      const existingProfile = await tx.user.findUnique({

        where: { id: authUserId },

        select: { id: true },

      });



      if (existingProfile) {

        throw new InviteRegistrationError(

          "A profile already exists for this account.",

          409,

        );

      }



      const created = await tx.user.create({

        data: {

          id: authUserId,

          email,

          firstName,

          lastName,

          teamId: lockedInvite.teamId,

          discordId: verifiedDiscordId,

          ...(verifiedDiscordId
            ? {
                discordAccount: {
                  create: {
                    discordId: verifiedDiscordId,
                    discordUsername: discordAuthUser
                      ? getDiscordUsernameFromAuthUser(discordAuthUser)
                      : null,
                  },
                },
              }
            : {}),

          verificationMethod: useDiscordVerify ? "DISCORD" : "EMAIL",

          isVerified: useDiscordVerify,

        },

      });



      await incrementInviteUse(tx, lockedInvite.id);



      return created;

    });



    return NextResponse.json(

      {

        message: "Registration complete.",

        userId: profile.id,

        requiresEmailConfirmation: !useDiscordVerify,

      },

      { status: 201 },

    );

  } catch (error) {
    if (error instanceof InviteNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof InviteExhaustedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof InviteExpiredError) {
      return NextResponse.json({ error: error.message }, { status: 410 });
    }

    if (error instanceof InviteRegistrationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }



    if (error instanceof Prisma.PrismaClientKnownRequestError) {

      if (error.code === "P2002") {

        return NextResponse.json(

          { error: "An account with this email already exists." },

          { status: 409 },

        );

      }

    }



    throw error;

  }

}



class InviteRegistrationError extends Error {

  constructor(

    message: string,

    readonly status: number,

  ) {

    super(message);

    this.name = "InviteRegistrationError";

  }

}

