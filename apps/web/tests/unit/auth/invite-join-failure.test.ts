import { describe, expect, it, vi } from "vitest";

import {
  getInviteCodeFromUserMetadata,
  getInviteCookieMaxAgeSeconds,
  getInviteFailureReasonFromError,
  getInviteJoinFailureReason,
  INVITE_COOKIE_MAX_AGE_SECONDS,
  InviteExhaustedError,
  InviteExpiredError,
  InviteNotFoundError,
  InviteReservedError,
  isReservationActive,
  RESERVATION_TTL_MS,
} from "@/lib/auth/invite";

import { buildInvite, hoursAgo, hoursFromNow } from "../../helpers/auth/invite-builders";
import { TEST_AUTH_USER_A, TEST_AUTH_USER_B } from "../../helpers/auth/test-database";

describe("invite join failure reasons", () => {
  it("returns not_found when invite is missing", () => {
    expect(getInviteJoinFailureReason(null)).toBe("not_found");
    expect(getInviteJoinFailureReason(undefined)).toBe("not_found");
  });

  it("returns expired for past expiresAt (checklist: expired link)", () => {
    const invite = buildInvite({
      id: "expired",
      teamId: "team-1",
      expiresAt: hoursAgo(1),
    });

    expect(getInviteJoinFailureReason(invite)).toBe("expired");
  });

  it("returns exhausted when usesCount reaches maxUses (checklist: exhausted invite)", () => {
    const invite = buildInvite({
      id: "exhausted",
      teamId: "team-1",
      maxUses: 1,
      usesCount: 1,
    });

    expect(getInviteJoinFailureReason(invite)).toBe("exhausted");
  });

  it("returns reserved when another user holds an active reservation (checklist: user B blocked)", () => {
    const invite = buildInvite({
      id: "reserved",
      teamId: "team-1",
      reservedByUserId: TEST_AUTH_USER_A,
      reservedAt: new Date(),
    });

    expect(getInviteJoinFailureReason(invite)).toBe("reserved");
  });

  it("returns null for a usable invite", () => {
    const invite = buildInvite({
      id: "valid",
      teamId: "team-1",
    });

    expect(getInviteJoinFailureReason(invite)).toBeNull();
  });

  it("treats stale reservations as usable (checklist: abandon after TTL)", () => {
    const invite = buildInvite({
      id: "stale-reservation",
      teamId: "team-1",
      reservedByUserId: TEST_AUTH_USER_A,
      reservedAt: hoursAgo(49),
    });

    expect(isReservationActive(invite)).toBe(false);
    expect(getInviteJoinFailureReason(invite)).toBeNull();
  });
});

describe("invite reservation TTL", () => {
  it("is active within RESERVATION_TTL_MS", () => {
    vi.useFakeTimers();
    const now = new Date("2026-06-27T12:00:00.000Z");
    vi.setSystemTime(now);

    const invite = buildInvite({
      id: "active",
      teamId: "team-1",
      reservedByUserId: TEST_AUTH_USER_A,
      reservedAt: new Date(now.getTime() - RESERVATION_TTL_MS + 60_000),
    });

    expect(isReservationActive(invite)).toBe(true);

    vi.useRealTimers();
  });

  it("expires after RESERVATION_TTL_MS", () => {
    vi.useFakeTimers();
    const now = new Date("2026-06-27T12:00:00.000Z");
    vi.setSystemTime(now);

    const invite = buildInvite({
      id: "expired-reservation",
      teamId: "team-1",
      reservedByUserId: TEST_AUTH_USER_A,
      reservedAt: new Date(now.getTime() - RESERVATION_TTL_MS - 1),
    });

    expect(isReservationActive(invite)).toBe(false);

    vi.useRealTimers();
  });
});

describe("invite cookie max age", () => {
  it("caps cookie lifetime at seven days", () => {
    const expiresAt = hoursFromNow(24 * 30);

    expect(getInviteCookieMaxAgeSeconds(expiresAt)).toBe(
      INVITE_COOKIE_MAX_AGE_SECONDS,
    );
  });

  it("uses seconds until invite expiry when sooner than seven days", () => {
    vi.useFakeTimers();
    const now = new Date("2026-06-27T12:00:00.000Z");
    vi.setSystemTime(now);

    const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    expect(getInviteCookieMaxAgeSeconds(expiresAt)).toBe(2 * 60 * 60);

    vi.useRealTimers();
  });

  it("never returns a negative max age", () => {
    expect(getInviteCookieMaxAgeSeconds(hoursAgo(1))).toBe(0);
  });
});

describe("invite metadata and error mapping", () => {
  it("reads invite_code from Supabase user metadata", () => {
    expect(
      getInviteCodeFromUserMetadata({
        user_metadata: { invite_code: "  abc123  " },
      }),
    ).toBe("abc123");
  });

  it("returns null when invite_code metadata is missing or blank", () => {
    expect(getInviteCodeFromUserMetadata({ user_metadata: {} })).toBeNull();
    expect(
      getInviteCodeFromUserMetadata({
        user_metadata: { invite_code: "   " },
      }),
    ).toBeNull();
  });

  it("maps invite errors to join failure reasons", () => {
    expect(getInviteFailureReasonFromError(new InviteReservedError())).toBe(
      "reserved",
    );
    expect(getInviteFailureReasonFromError(new InviteExpiredError())).toBe(
      "expired",
    );
    expect(getInviteFailureReasonFromError(new InviteExhaustedError())).toBe(
      "exhausted",
    );
    expect(getInviteFailureReasonFromError(new InviteNotFoundError())).toBe(
      "not_found",
    );
    expect(getInviteFailureReasonFromError(new Error("other"))).toBe(
      "not_found",
    );
  });
});
