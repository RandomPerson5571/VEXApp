"use client";

import { useMemo, useState, type ChangeEvent, type CSSProperties, type FocusEvent } from "react";
import {
  Crown,
  Mail,
  Search,
  Shield,
  UserRound,
  Users,
  X,
} from "lucide-react";

import type { UserRole } from "@stlvex/database/types";
import { cn } from "@stlvex/ui";

import { Input } from "@stlvex/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stlvex/ui/components/select";
import { Skeleton } from "@stlvex/ui/components/skeleton";
import { Switch } from "@stlvex/ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@stlvex/ui/components/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@stlvex/ui/components/tooltip";

import {
  AdminEmptyState,
  AdminStatChip,
  AdminTableFrame,
  adminInlineInputClassName,
  adminSelectContentClassName,
  adminSelectItemClassName,
  adminSwitchClassName,
  adminTableHeadClassName,
  adminTableRowClassName,
} from "./AdminPanelPrimitives";
import { getInitials } from "@/components/tasks/task-list-utils";
import { ADMIN_INLINE_SAVE_DELAY_MS } from "@/lib/constants/request-timing";
import { RateLimitError } from "@/lib/errors/rate-limit-error";
import { useDebouncedSaver } from "@/lib/hooks/use-debounced-saver";
import { throwIfRateLimited } from "@/lib/queries/api-response";
import {
  formatRole,
  formatTeamLabel,
  sortUsersByTeam,
  type AdminTeamOption,
  type AdminUserRow,
} from "./admin-types";

const ROLE_OPTIONS: UserRole[] = ["ADMIN", "TEAM_LEADER", "TEAM_MEMBER"];

const NO_TEAM_VALUE = "__none__";

const ROLE_ACCENT: Record<UserRole, string> = {
  ADMIN: "text-amber-300",
  TEAM_LEADER: "text-blue-300",
  TEAM_MEMBER: "text-slate-300",
};

type AdminUserManagementTableProps = {
  users: AdminUserRow[];
  teamOptions: AdminTeamOption[];
  currentUserId: string;
  onUsersChange: (users: AdminUserRow[]) => void;
  onError: (message: string | null) => void;
};

export function AdminUserManagementTable({
  users,
  teamOptions,
  currentUserId,
  onUsersChange,
  onError,
}: AdminUserManagementTableProps) {
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const sortedUsers = useMemo(() => sortUsersByTeam(users), [users]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return sortedUsers;
    }

    return sortedUsers.filter((user) => {
      const haystack = [
        user.firstName,
        user.lastName,
        user.email,
        user.team?.name,
        user.team?.number,
        formatRole(user.role),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [searchQuery, sortedUsers]);

  const adminCount = users.filter((user) => user.isAdmin).length;
  const hasActiveSearch = searchQuery.trim().length > 0;

  async function updateUser(
    userId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      role?: UserRole;
      teamId?: string | null;
    },
  ) {
    onError(null);
    setPendingUserId(userId);

    try {
      const response = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...updates }),
      });

      throwIfRateLimited(response);

      const payload = (await response.json()) as AdminUserRow & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update user.");
      }

      onUsersChange(
        sortUsersByTeam(
          users.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  firstName: payload.firstName,
                  lastName: payload.lastName,
                  role: payload.role,
                  teamId: payload.teamId,
                  team: payload.team,
                }
              : user,
          ),
        ),
      );
    } catch (updateError) {
      onError(
        updateError instanceof RateLimitError
          ? updateError.message
          : updateError instanceof Error
            ? updateError.message
            : "Failed to update user.",
      );
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleToggle(userId: string, nextIsAdmin: boolean) {
    onError(null);
    setPendingUserId(userId);

    try {
      const response = await fetch("/api/admin/toggle-perms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isAdmin: nextIsAdmin }),
      });

      throwIfRateLimited(response);

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update permissions.");
      }

      onUsersChange(
        users.map((user) =>
          user.id === userId ? { ...user, isAdmin: nextIsAdmin } : user,
        ),
      );
    } catch (toggleError) {
      onError(
        toggleError instanceof RateLimitError
          ? toggleError.message
          : toggleError instanceof Error
            ? toggleError.message
            : "Failed to update permissions.",
      );
    } finally {
      setPendingUserId(null);
    }
  }

  const scheduleUserUpdate = useDebouncedSaver<
    {
      firstName?: string;
      lastName?: string;
      role?: UserRole;
      teamId?: string | null;
    }
  >(ADMIN_INLINE_SAVE_DELAY_MS, async (userId, updates) => {
    await updateUser(userId, updates);
  });

  function handleNameBlur(
    user: AdminUserRow,
    field: "firstName" | "lastName",
    value: string,
  ) {
    const trimmed = value.trim();

    if (!trimmed || trimmed === user[field]) {
      return;
    }

    void scheduleUserUpdate(user.id, { [field]: trimmed });
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatChip
              icon={Users}
              label={
                hasActiveSearch
                  ? `${filteredUsers.length} of ${users.length} users`
                  : `${users.length} user${users.length === 1 ? "" : "s"}`
              }
              variant="accent"
            />
            <AdminStatChip
              icon={Shield}
              label={`${adminCount} platform admin${adminCount === 1 ? "" : "s"}`}
              variant={adminCount > 0 ? "success" : "default"}
            />
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search users…"
              className={cn(adminInlineInputClassName, "pl-9 pr-9")}
              aria-label="Search users"
            />
            {hasActiveSearch ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-0.5 text-slate-500 transition hover:bg-slate-800/80 hover:text-slate-300"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <AdminTableFrame>
          <Table className="min-w-[56rem]">
            <TableHeader>
              <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                <TableHead className={cn(adminTableHeadClassName, "w-[14rem]")}>
                  Member
                </TableHead>
                <TableHead className={cn(adminTableHeadClassName, "w-[12rem]")}>
                  Team
                </TableHead>
                <TableHead className={cn(adminTableHeadClassName, "w-[9rem]")}>
                  First name
                </TableHead>
                <TableHead className={cn(adminTableHeadClassName, "w-[9rem]")}>
                  Last name
                </TableHead>
                <TableHead className={adminTableHeadClassName}>Email</TableHead>
                <TableHead className={cn(adminTableHeadClassName, "w-[10rem]")}>
                  Role
                </TableHead>
                <TableHead className={cn(adminTableHeadClassName, "w-[8rem] text-right")}>
                  Admin
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7}>
                    <AdminEmptyState
                      icon={Users}
                      title="No users in the platform"
                      description="Users will appear here once they sign up and verify their accounts."
                    />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7}>
                    <AdminEmptyState
                      icon={UserRound}
                      title="No users match your search"
                      description="Try a different name, email, team, or role keyword."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user, index) => {
                  const isSelf = user.id === currentUserId;
                  const isPending = pendingUserId === user.id;
                  const fullName = `${user.firstName} ${user.lastName}`;

                  return (
                    <TableRow
                      key={user.id}
                      className={cn(adminTableRowClassName, isPending && "opacity-60")}
                      style={{ animationDelay: `${index * 35}ms` } as CSSProperties}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-slate-800 bg-gradient-to-br from-blue-700 to-indigo-800 text-[10px] font-bold text-white shadow-sm"
                            aria-hidden
                          >
                            {getInitials(user.firstName, user.lastName)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-100">
                              {fullName}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              {isSelf ? (
                                <span className="inline-flex h-5 items-center rounded-md border border-slate-700/80 bg-slate-900/60 px-1.5 text-[10px] font-bold text-slate-400">
                                  You
                                </span>
                              ) : null}
                              {user.isAdmin ? (
                                <span className="inline-flex h-5 items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/10 px-1.5 text-[10px] font-bold text-amber-300">
                                  <Crown className="size-3" aria-hidden />
                                  Admin
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {isPending ? (
                          <Skeleton className="h-9 w-full rounded-md bg-slate-800/60" />
                        ) : (
                          <Select
                            value={user.teamId ?? NO_TEAM_VALUE}
                            onValueChange={(value: string) => {
                              const nextTeamId =
                                value === NO_TEAM_VALUE ? null : value;

                              if (nextTeamId === user.teamId) {
                                return;
                              }

                              void scheduleUserUpdate(user.id, { teamId: nextTeamId });
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                adminInlineInputClassName,
                                "w-full font-semibold",
                              )}
                            >
                              <SelectValue placeholder="Assign team" />
                            </SelectTrigger>
                            <SelectContent
                              position="popper"
                              sideOffset={4}
                              className={adminSelectContentClassName}
                            >
                              <SelectItem
                                value={NO_TEAM_VALUE}
                                className={adminSelectItemClassName}
                              >
                                No team
                              </SelectItem>
                              {teamOptions.map((team) => (
                                <SelectItem
                                  key={team.id}
                                  value={team.id}
                                  className={adminSelectItemClassName}
                                >
                                  {formatTeamLabel(team)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>

                      <TableCell>
                        {isPending ? (
                          <Skeleton className="h-9 w-full rounded-md bg-slate-800/60" />
                        ) : (
                          <Input
                            defaultValue={user.firstName}
                            key={`${user.id}-first-${user.firstName}`}
                            onBlur={(event: FocusEvent<HTMLInputElement>) =>
                              handleNameBlur(user, "firstName", event.target.value)
                            }
                            className={adminInlineInputClassName}
                            aria-label={`First name for ${user.email}`}
                          />
                        )}
                      </TableCell>

                      <TableCell>
                        {isPending ? (
                          <Skeleton className="h-9 w-full rounded-md bg-slate-800/60" />
                        ) : (
                          <Input
                            defaultValue={user.lastName}
                            key={`${user.id}-last-${user.lastName}`}
                            onBlur={(event: FocusEvent<HTMLInputElement>) =>
                              handleNameBlur(user, "lastName", event.target.value)
                            }
                            className={adminInlineInputClassName}
                            aria-label={`Last name for ${user.email}`}
                          />
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex min-w-[10rem] items-center gap-2 text-slate-400">
                          <Mail className="size-3.5 shrink-0 opacity-70" aria-hidden />
                          <span className="truncate text-xs font-semibold">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {isPending ? (
                          <Skeleton className="h-9 w-full rounded-md bg-slate-800/60" />
                        ) : (
                          <Select
                            value={user.role}
                            onValueChange={(value: string) => {
                              const nextRole = value as UserRole;

                              if (nextRole === user.role) {
                                return;
                              }

                              void scheduleUserUpdate(user.id, { role: nextRole });
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                adminInlineInputClassName,
                                "w-full font-bold",
                                ROLE_ACCENT[user.role],
                              )}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent
                              position="popper"
                              sideOffset={4}
                              className={adminSelectContentClassName}
                            >
                              {ROLE_OPTIONS.map((role) => (
                                <SelectItem
                                  key={role}
                                  value={role}
                                  className={cn(
                                    adminSelectItemClassName,
                                    "font-semibold",
                                    ROLE_ACCENT[role],
                                  )}
                                >
                                  {formatRole(role)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Switch
                              checked={user.isAdmin}
                              disabled={isPending}
                              onCheckedChange={(checked: boolean) =>
                                handleToggle(user.id, checked)
                              }
                              className={adminSwitchClassName}
                              aria-label={`${user.isAdmin ? "Revoke" : "Grant"} platform admin access for ${fullName}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-xs font-semibold">
                            {user.isAdmin
                              ? "Revoke platform administrator access"
                              : "Grant platform administrator access"}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </AdminTableFrame>
      </div>
    </TooltipProvider>
  );
}
