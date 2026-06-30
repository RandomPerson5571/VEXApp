import { describe, expect, it } from "vitest";

import {
  assertInviteUsable,
  InviteExhaustedError,
  InviteExpiredError,
  InviteNotFoundError,
  InviteReservedError,
  isInviteUsable,
} from "@/lib/auth/invite";

import { buildInvite, hoursAgo } from "../../helpers/auth/invite-builders";
import { TEST_AUTH_USER_A, TEST_AUTH_USER_B } from "../../helpers/auth/test-database";

describe("invite usability", () => {
  it("reports usable invites without a reservation", () => {
    const invite = buildInvite({ id: "valid", teamId: "team-1" });

    expect(isInviteUsable(invite)).toBe(true);
    expect(() => assertInviteUsable(invite)).not.toThrow();
  });

  it("throws InviteNotFoundError when invite is undefined", () => {
    expect(() => assertInviteUsable(undefined)).toThrow(InviteNotFoundError);
  });

  it("throws InviteExpiredError for expired invites", () => {
    const invite = buildInvite({
      id: "expired",
      teamId: "team-1",
      expiresAt: hoursAgo(1),
    });

    expect(isInviteUsable(invite)).toBe(false);
    expect(() => assertInviteUsable(invite)).toThrow(InviteExpiredError);
  });

  it("throws InviteExhaustedError when max uses are reached", () => {
    const invite = buildInvite({
      id: "exhausted",
      teamId: "team-1",
      maxUses: 1,
      usesCount: 1,
    });

    expect(isInviteUsable(invite)).toBe(false);
    expect(() => assertInviteUsable(invite)).toThrow(InviteExhaustedError);
  });

  it("blocks other users while a reservation is active", () => {
    const invite = buildInvite({
      id: "reserved",
      teamId: "team-1",
      reservedByUserId: TEST_AUTH_USER_A,
      reservedAt: new Date(),
    });

    expect(isInviteUsable(invite, TEST_AUTH_USER_B)).toBe(false);
    expect(() => assertInviteUsable(invite, TEST_AUTH_USER_B)).toThrow(
      InviteReservedError,
    );
  });

  it("allows the reserving user to proceed (checklist: email delay)", () => {
    const invite = buildInvite({
      id: "reserved-by-a",
      teamId: "team-1",
      reservedByUserId: TEST_AUTH_USER_A,
      reservedAt: new Date(),
    });

    expect(isInviteUsable(invite, TEST_AUTH_USER_A)).toBe(true);
    expect(() => assertInviteUsable(invite, TEST_AUTH_USER_A)).not.toThrow();
  });

  it("ignores stale reservations for all users", () => {
    const invite = buildInvite({
      id: "stale",
      teamId: "team-1",
      reservedByUserId: TEST_AUTH_USER_A,
      reservedAt: hoursAgo(49),
    });

    expect(isInviteUsable(invite, TEST_AUTH_USER_B)).toBe(true);
    expect(() => assertInviteUsable(invite, TEST_AUTH_USER_B)).not.toThrow();
  });
});
