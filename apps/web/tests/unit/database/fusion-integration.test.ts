import { prisma } from "@stlvex/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { findTeamFusionIntegrationByProjectUrn } from "@stlvex/database";

describe("findTeamFusionIntegrationByProjectUrn", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("looks up an active integration by project URN", async () => {
    const findFirst = vi
      .spyOn(prisma.teamFusionIntegration, "findFirst")
      .mockResolvedValue(null);

    await findTeamFusionIntegrationByProjectUrn(
      "urn:adsk.wipprod:fs.folder:co.abc123",
    );

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        projectUrn: "urn:adsk.wipprod:fs.folder:co.abc123",
        isActive: true,
      },
      include: { team: true },
    });
  });
});
