"use client";

import { useMemo, useState, type ChangeEvent, type FocusEvent } from "react";
import {
  Crown,
  Mail,
  Search,
  Shield,
  UserRound,
  Users,
} from "lucide-react";

import type { UserRole } from "@stlvex/database/types";
import { cn } from "@stlvex/ui";

import { Avatar, AvatarFallback } from "@stlvex/ui/components/avatar";
import { badgeVariants } from "@stlvex/ui/components/badge";
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
  formatRole,
  formatTeamLabel,
  sortUsersByTeam,
  type AdminTeamOption,
  type AdminUserRow,
} from "./admin-types";

const ROLE_OPTIONS: UserRole[] = ["ADMIN", "TEAM_LEADER", "TEAM_MEMBER"];

const NO_TEAM_VALUE = "__none__";

type AdminUserManagementTableProps = {
  users: AdminUserRow[];
  teamOptions: AdminTeamOption[];
  currentUserId: string;
  onUsersChange: (users: AdminUserRow[]) => void;
  onError: (message: string | null) => void;
};

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

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
        updateError instanceof Error
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
        toggleError instanceof Error
          ? toggleError.message
          : "Failed to update permissions.",
      );
    } finally {
      setPendingUserId(null);
    }
  }

  function handleNameBlur(
    user: AdminUserRow,
    field: "firstName" | "lastName",
    value: string,
  ) {
    const trimmed = value.trim();

    if (!trimmed || trimmed === user[field]) {
      return;
    }

    void updateUser(user.id, { [field]: trimmed });
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                badgeVariants({ variant: "secondary" }),
                "inline-flex items-center gap-1.5 px-2.5 py-1",
              )}
            >
              <Users data-icon="inline-start" />
              {users.length} users
            </span>
            <span
              className={cn(
                badgeVariants({ variant: "outline" }),
                "inline-flex items-center gap-1.5 px-2.5 py-1",
              )}
            >
              <Shield data-icon="inline-start" />
              {users.filter((user) => user.isAdmin).length} platform admins
            </span>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search users…"
              className="pl-9"
              aria-label="Search users"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40 shadow-sm backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="w-[14rem]">Member</TableHead>
                <TableHead className="w-[12rem]">Team</TableHead>
                <TableHead className="w-[9rem]">First name</TableHead>
                <TableHead className="w-[9rem]">Last name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[10rem]">Role</TableHead>
                <TableHead className="w-[8rem] text-right">Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="h-28 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <UserRound className="size-8 opacity-40" />
                      <p className="text-sm font-medium">No users match your search</p>
                    </div>
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
                      className={cn(
                        "border-border/40 transition-colors",
                        "animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-backwards duration-300",
                        isPending && "opacity-70",
                      )}
                      style={{ animationDelay: `${index * 35}ms` }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 border border-border/60">
                            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                              {getInitials(user.firstName, user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {fullName}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              {isSelf ? (
                                <span
                                  className={cn(
                                    badgeVariants({ variant: "secondary" }),
                                    "inline-flex h-5 items-center px-1.5 text-[10px]",
                                  )}
                                >
                                  You
                                </span>
                              ) : null}
                              {user.isAdmin ? (
                                <span
                                  className={cn(
                                    badgeVariants({ variant: "default" }),
                                    "inline-flex h-5 items-center gap-1 px-1.5 text-[10px]",
                                  )}
                                >
                                  <Crown data-icon="inline-start" />
                                  Admin
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {isPending ? (
                          <Skeleton className="h-9 w-full rounded-md" />
                        ) : (
                          <Select
                            value={user.teamId ?? NO_TEAM_VALUE}
                            onValueChange={(value: string) => {
                              const nextTeamId =
                                value === NO_TEAM_VALUE ? null : value;

                              if (nextTeamId === user.teamId) {
                                return;
                              }

                              void updateUser(user.id, { teamId: nextTeamId });
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Assign team" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NO_TEAM_VALUE}>No team</SelectItem>
                              {teamOptions.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                  {formatTeamLabel(team)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>

                      <TableCell>
                        {isPending ? (
                          <Skeleton className="h-9 w-full rounded-md" />
                        ) : (
                          <Input
                            defaultValue={user.firstName}
                            key={`${user.id}-first-${user.firstName}`}
                            onBlur={(event: FocusEvent<HTMLInputElement>) =>
                              handleNameBlur(user, "firstName", event.target.value)
                            }
                            className="h-9"
                            aria-label={`First name for ${user.email}`}
                          />
                        )}
                      </TableCell>

                      <TableCell>
                        {isPending ? (
                          <Skeleton className="h-9 w-full rounded-md" />
                        ) : (
                          <Input
                            defaultValue={user.lastName}
                            key={`${user.id}-last-${user.lastName}`}
                            onBlur={(event: FocusEvent<HTMLInputElement>) =>
                              handleNameBlur(user, "lastName", event.target.value)
                            }
                            className="h-9"
                            aria-label={`Last name for ${user.email}`}
                          />
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex min-w-[10rem] items-center gap-2 text-muted-foreground">
                          <Mail className="size-3.5 shrink-0 opacity-70" />
                          <span className="truncate text-xs font-medium">{user.email}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {isPending ? (
                          <Skeleton className="h-9 w-full rounded-md" />
                        ) : (
                          <Select
                            value={user.role}
                            onValueChange={(value: string) => {
                              const nextRole = value as UserRole;

                              if (nextRole === user.role) {
                                return;
                              }

                              void updateUser(user.id, { role: nextRole });
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map((role) => (
                                <SelectItem key={role} value={role}>
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
                            <div className="inline-flex items-center justify-end gap-2">
                              <Switch
                                checked={user.isAdmin}
                                disabled={isPending}
                                onCheckedChange={(checked: boolean) =>
                                  handleToggle(user.id, checked)
                                }
                                aria-label={`${user.isAdmin ? "Revoke" : "Grant"} platform admin access for ${fullName}`}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left">
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
        </div>
      </div>
    </TooltipProvider>
  );
}
