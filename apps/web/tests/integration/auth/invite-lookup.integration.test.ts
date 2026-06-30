import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getInviteByCode, getInviteFailureReason } from "@/lib/auth/invite";

import { hoursAgo } from "../../helpers/auth/invite-builders";
import {
  createTestInvite,
  createTestTeam,
  deleteTestInvite,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/auth/test-database";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("invite lookup integration", () => {
  let teamId = "";
  const inviteIds: string[] = [];

  beforeEach(async () => {
    const team = await createTestTeam();
    teamId = team.id;
  });

  afterEach(async () => {
    for (const id of inviteIds.splice(0)) {
      await deleteTestInvite(id);
    }

    if (teamId) {
      await deleteTestTeam(teamId);
    }
  });

  it("returns expired for expired invites at join time", async () => {
    const invite = await createTestInvite(teamId, {
      expiresAt: hoursAgo(1),
    });
    inviteIds.push(invite.id);

    await expect(getInviteFailureReason(invite.id)).resolves.toBe("expired");
    await expect(getInviteByCode(invite.id)).resolves.toBeNull();
  });

  it("returns exhausted when uses are fully consumed", async () => {
    const invite = await createTestInvite(teamId, {
      maxUses: 1,
      usesCount: 1,
    });
    inviteIds.push(invite.id);

    await expect(getInviteFailureReason(invite.id)).resolves.toBe("exhausted");
    await expect(getInviteByCode(invite.id)).resolves.toBeNull();
  });

  it("returns not_found for unknown invite codes", async () => {
    await expect(getInviteFailureReason("missing-invite-code")).resolves.toBe(
      "not_found",
    );
  });
});
