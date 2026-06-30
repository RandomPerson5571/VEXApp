import type { ValidInvite } from "@/lib/auth/invite";

type InviteBuilderInput = Partial<ValidInvite> & Pick<ValidInvite, "id" | "teamId">;

export function buildInvite(input: InviteBuilderInput): ValidInvite {
  return {
    maxUses: 1,
    usesCount: 0,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    reservedByUserId: null,
    reservedAt: null,
    ...input,
  };
}

export function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}
