import { prisma } from "@stlvex/database";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  consumeInvite,
  getInviteByCode,
  getInviteFailureReason,
  InviteReservedError,
  releaseInviteReservation,
  reserveInviteForUser,
} from "@/lib/auth/invite";

import { hoursAgo } from "../../helpers/auth/invite-builders";
import {
  createTestInvite,
  createTestTeam,
  deleteTestInvite,
  deleteTestTeam,
  hasTestDatabase,
  TEST_AUTH_USER_A,
  TEST_AUTH_USER_B,
} from "../../helpers/auth/test-database";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("invite reservation integration", () => {
  let teamId = "";
  let inviteId = "";

  beforeEach(async () => {
    const team = await createTestTeam();
    teamId = team.id;

    const invite = await createTestInvite(teamId, { maxUses: 1 });
    inviteId = invite.id;
  });

  afterEach(async () => {
    if (inviteId) {
      await deleteTestInvite(inviteId);
    }

    if (teamId) {
      await deleteTestTeam(teamId);
    }

    inviteId = "";
    teamId = "";
  });

  it("reserves an invite for user A at callback time", async () => {
    await prisma.$transaction(async (tx) => {
      await reserveInviteForUser(tx, inviteId, TEST_AUTH_USER_A);
    });

    const row = await prisma.invite.findUnique({ where: { id: inviteId } });

    expect(row?.reservedByUserId).toBe(TEST_AUTH_USER_A);
    expect(row?.reservedAt).toBeInstanceOf(Date);
  });

  it("blocks user B while user A holds an active reservation", async () => {
    await prisma.$transaction(async (tx) => {
      await reserveInviteForUser(tx, inviteId, TEST_AUTH_USER_A);
    });

    await expect(
      prisma.$transaction(async (tx) => {
        await reserveInviteForUser(tx, inviteId, TEST_AUTH_USER_B);
      }),
    ).rejects.toBeInstanceOf(InviteReservedError);

    await expect(getInviteByCode(inviteId, TEST_AUTH_USER_B)).resolves.toBeNull();
    await expect(getInviteFailureReason(inviteId)).resolves.toBe("reserved");
  });

  it("allows user A to consume after email delay when reservation matches", async () => {
    await prisma.$transaction(async (tx) => {
      await reserveInviteForUser(tx, inviteId, TEST_AUTH_USER_A);
    });

    const consumed = await prisma.$transaction(async (tx) => {
      return consumeInvite(tx, inviteId, TEST_AUTH_USER_A);
    });

    expect(consumed.usesCount).toBe(1);
    expect(consumed.reservedByUserId).toBeNull();
    expect(consumed.reservedAt).toBeNull();

    const row = await prisma.invite.findUnique({ where: { id: inviteId } });
    expect(row?.usesCount).toBe(1);
    expect(row?.reservedByUserId).toBeNull();
  });

  it("rejects consume when another user holds the reservation", async () => {
    await prisma.$transaction(async (tx) => {
      await reserveInviteForUser(tx, inviteId, TEST_AUTH_USER_A);
    });

    await expect(
      prisma.$transaction(async (tx) => {
        await consumeInvite(tx, inviteId, TEST_AUTH_USER_B);
      }),
    ).rejects.toBeInstanceOf(InviteReservedError);
  });

  it("releases only the owning user's reservation", async () => {
    await prisma.$transaction(async (tx) => {
      await reserveInviteForUser(tx, inviteId, TEST_AUTH_USER_A);
    });

    await prisma.$transaction(async (tx) => {
      await releaseInviteReservation(tx, inviteId, TEST_AUTH_USER_B);
    });

    let row = await prisma.invite.findUnique({ where: { id: inviteId } });
    expect(row?.reservedByUserId).toBe(TEST_AUTH_USER_A);

    await prisma.$transaction(async (tx) => {
      await releaseInviteReservation(tx, inviteId, TEST_AUTH_USER_A);
    });

    row = await prisma.invite.findUnique({ where: { id: inviteId } });
    expect(row?.reservedByUserId).toBeNull();
    expect(row?.reservedAt).toBeNull();
  });

  it("allows a new user after reservation TTL expires", async () => {
    await prisma.invite.update({
      where: { id: inviteId },
      data: {
        reservedByUserId: TEST_AUTH_USER_A,
        reservedAt: hoursAgo(49),
      },
    });

    await expect(getInviteByCode(inviteId, TEST_AUTH_USER_B)).resolves.toMatchObject(
      { id: inviteId },
    );

    await prisma.$transaction(async (tx) => {
      await reserveInviteForUser(tx, inviteId, TEST_AUTH_USER_B);
    });

    const row = await prisma.invite.findUnique({ where: { id: inviteId } });
    expect(row?.reservedByUserId).toBe(TEST_AUTH_USER_B);
  });
});
