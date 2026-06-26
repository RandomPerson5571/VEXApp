import { prisma } from "@stlvex/database";

export type ProfileLookupResult =
  | { status: "found" }
  | { status: "missing" }
  | { status: "unavailable" };

export async function lookupUserProfile(
  userId: string,
): Promise<ProfileLookupResult> {
  try {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    return profile ? { status: "found" } : { status: "missing" };
  } catch (error) {
    console.error("[auth] profile lookup failed:", error);
    return { status: "unavailable" };
  }
}
