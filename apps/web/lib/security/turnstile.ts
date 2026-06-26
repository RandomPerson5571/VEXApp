import { getRequestClientIp } from "@/lib/security/client-ip";

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

export async function verifyTurnstileToken(
  request: Request,
  token: string | undefined,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secret) {
    return { ok: true };
  }

  if (!token?.trim()) {
    return { ok: false, error: "CAPTCHA verification is required." };
  }

  const body = new URLSearchParams({
    secret,
    response: token.trim(),
    remoteip: getRequestClientIp(request),
  });

  let response: Response;

  try {
    response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      },
    );
  } catch {
    return { ok: false, error: "CAPTCHA verification is temporarily unavailable." };
  }

  if (!response.ok) {
    return { ok: false, error: "CAPTCHA verification failed." };
  }

  const result = (await response.json()) as TurnstileVerifyResponse;

  if (!result.success) {
    return { ok: false, error: "CAPTCHA verification failed." };
  }

  return { ok: true };
}
