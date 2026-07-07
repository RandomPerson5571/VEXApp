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

import { POST } from "@/app/api/admin/toggle-perms/route";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("admin toggle-perms integration", () => {
  let teamId = "";
  let adminId = "";
  let otherAdminId = "";

  beforeEach(async () => {
    vi.clearAllMocks();

    const team = await createTestTeam();
    teamId = team.id;

    const admin = await createTestUser(teamId, { isAdmin: true });
    const otherAdmin = await createTestUser(teamId, { isAdmin: true });
    adminId = admin.id;
    otherAdminId = otherAdmin.id;

    verifyCurrentUserPermissionsMock.mockResolvedValue({
      authorized: true,
      scope: "GLOBAL",
    });
    getCurrentUserMock.mockResolvedValue({ profile: { id: adminId } });
  });

  afterEach(async () => {
    if (teamId) {
      await deleteTestTeam(teamId);
    }

    teamId = "";
    adminId = "";
    otherAdminId = "";
  });

  it("blocks self-revoke of admin access", async () => {
    const response = await POST(
      new Request("https://example.test/api/admin/toggle-perms", {
        method: "POST",
        body: JSON.stringify({ userId: adminId, isAdmin: false }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await prisma.user.findUnique({ where: { id: adminId } })).toMatchObject({
      isAdmin: true,
    });
  });

  it("blocks removing the last platform administrator", async () => {
    await prisma.user.update({
      where: { id: otherAdminId },
      data: { isAdmin: false },
    });

    const response = await POST(
      new Request("https://example.test/api/admin/toggle-perms", {
        method: "POST",
        body: JSON.stringify({ userId: adminId, isAdmin: false }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("toggles admin access for another user", async () => {
    const response = await POST(
      new Request("https://example.test/api/admin/toggle-perms", {
        method: "POST",
        body: JSON.stringify({ userId: otherAdminId, isAdmin: false }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await prisma.user.findUnique({ where: { id: otherAdminId } })).toMatchObject({
      isAdmin: false,
    });
  });
});
