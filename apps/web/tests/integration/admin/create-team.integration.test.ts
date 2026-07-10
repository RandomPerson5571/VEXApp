import { prisma } from "@stlvex/database";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/auth/test-database";

const verifyCurrentUserPermissionsMock = vi.hoisted(() => vi.fn());
const getCurrentUserMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/auth-guards-server", () => ({
  verifyCurrentUserPermissions: verifyCurrentUserPermissionsMock,
}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: getCurrentUserMock,
}));

import { POST } from "@/app/api/admin/create-team/route";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("admin create-team integration", () => {
  let adminUserId = "";
  let createdTeamIds: string[] = [];

  beforeEach(async () => {
    vi.clearAllMocks();
    verifyCurrentUserPermissionsMock.mockResolvedValue({
      authorized: true,
      scope: "GLOBAL",
    });

    const orphanTeam = await createTestTeam();
    const admin = await createTestUser(orphanTeam.id, { isAdmin: true });
    adminUserId = admin.id;
    createdTeamIds = [orphanTeam.id];
    getCurrentUserMock.mockResolvedValue({ profile: { id: adminUserId } });
  });

  afterEach(async () => {
    for (const id of createdTeamIds) {
      await deleteTestTeam(id).catch(() => undefined);
    }

    adminUserId = "";
    createdTeamIds = [];
  });

  it("creates a team for global admins", async () => {
    const number = `ADM${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

    const response = await POST(
      new Request("https://example.test/api/admin/create-team", {
        method: "POST",
        body: JSON.stringify({ name: "Admin Created Team", number }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    createdTeamIds.push(body.id);
    expect(body.number).toBe(number);
  });

  it("returns 409 for duplicate team numbers", async () => {
    const sharedNumber = `DUP${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const existing = await createTestTeam({ number: sharedNumber });
    createdTeamIds.push(existing.id);

    const response = await POST(
      new Request("https://example.test/api/admin/create-team", {
        method: "POST",
        body: JSON.stringify({
          name: "Duplicate Number Team",
          number: sharedNumber,
        }),
      }),
    );

    expect(response.status).toBe(409);
  });

  it("returns 409 for duplicate discordServerId", async () => {
    const serverId = `server-${crypto.randomUUID()}`;
    const first = await createTestTeam({ discordServerId: serverId });
    createdTeamIds.push(first.id);

    const response = await POST(
      new Request("https://example.test/api/admin/create-team", {
        method: "POST",
        body: JSON.stringify({
          name: "Duplicate Server Team",
          number: `DS${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
          discordServerId: serverId,
        }),
      }),
    );

    expect(response.status).toBe(409);
  });
});
