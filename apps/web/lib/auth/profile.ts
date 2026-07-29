import { prisma } from "@stlvex/database";

export type ProfileLookupResult =
  | { status: "found" }
  | { status: "banned" }
  | { status: "missing" }
  | { status: "unavailable" };

export async function lookupUserProfile(
  userId: string,
): Promise<ProfileLookupResult> {
  try {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, bannedAt: true },
    });

    if (!profile) {
      return { status: "missing" };
    }

    if (profile.bannedAt) {
      return { status: "banned" };
    }

    return { status: "found" };
  } catch (error) {
    console.error("[auth] profile lookup failed:", error);
    return { status: "unavailable" };
  }
}
