import { prisma } from "@stlvex/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { findTeamGitHubIntegrationByRepo } from "@stlvex/database";

describe("findTeamGitHubIntegrationByRepo", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("looks up an active integration by repository full name", async () => {
    const findFirst = vi
      .spyOn(prisma.teamGitHubIntegration, "findFirst")
      .mockResolvedValue(null);

    await findTeamGitHubIntegrationByRepo("vex-team/robot-code");

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        repositoryFullName: "vex-team/robot-code",
        isActive: true,
      },
      include: { team: true },
    });
  });
});
