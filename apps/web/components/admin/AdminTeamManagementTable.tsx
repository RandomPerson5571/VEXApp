"use client";

import {
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FocusEvent,
  type FormEvent,
} from "react";
import {
  Building2,
  Hash,
  Link2,
  Plus,
  Server,
  Shield,
  X,
} from "lucide-react";

import { cn } from "@stlvex/ui";

import { Button } from "@stlvex/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@stlvex/ui/components/card";
import { Input } from "@stlvex/ui/components/input";
import { Label } from "@stlvex/ui/components/label";
import { Separator } from "@stlvex/ui/components/separator";
import { Skeleton } from "@stlvex/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@stlvex/ui/components/table";

import {
  AdminEmptyState,
  AdminStatChip,
  AdminTableFrame,
  adminInlineInputClassName,
  adminTableHeadClassName,
  adminTableRowClassName,
} from "./AdminPanelPrimitives";
import { type AdminTeamRow } from "./admin-types";

type AdminTeamManagementTableProps = {
  teams: AdminTeamRow[];
  onTeamCreated: (team: AdminTeamRow) => void;
  onTeamUpdated: (team: AdminTeamRow) => void;
  onError: (message: string | null) => void;
};

function discordLinkBadge(linked: boolean) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold",
        linked
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
          : "border-slate-800/80 bg-slate-950/40 text-slate-500",
      )}
    >
      <Link2 className="size-3" aria-hidden />
      {linked ? "Discord linked" : "Not linked"}
    </span>
  );
}

export function AdminTeamManagementTable({
  teams,
  onTeamCreated,
  onTeamUpdated,
  onError,
}: AdminTeamManagementTableProps) {
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamNumber, setNewTeamNumber] = useState("");
  const [newTeamDiscordServerId, setNewTeamDiscordServerId] = useState("");
  const [newTeamDiscordRoleId, setNewTeamDiscordRoleId] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const discordLinkedCount = teams.filter(
    (team) => team.discordServerId && team.discordRoleId,
  ).length;

  async function updateTeam(
    teamId: string,
    updates: {
      name?: string;
      number?: string;
      discordServerId?: string | null;
      discordRoleId?: string | null;
    },
  ) {
    onError(null);
    setPendingTeamId(teamId);

    try {
      const response = await fetch("/api/admin/update-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, ...updates }),
      });

      const payload = (await response.json()) as AdminTeamRow & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update team.");
      }

      onTeamUpdated(payload);
    } catch (updateError) {
      onError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update team.",
      );
    } finally {
      setPendingTeamId(null);
    }
  }

  function handleTeamFieldBlur(
    team: AdminTeamRow,
    field: "name" | "number" | "discordServerId" | "discordRoleId",
    value: string,
  ) {
    const trimmed = value.trim();
    const currentValue = team[field] ?? "";

    if (field === "name" || field === "number") {
      if (!trimmed || trimmed === currentValue) {
        return;
      }

      void updateTeam(team.id, {
        [field]: field === "number" ? trimmed.toUpperCase() : trimmed,
      });
      return;
    }

    const nextValue = trimmed === "" ? null : trimmed;

    if (nextValue === team[field]) {
      return;
    }

    void updateTeam(team.id, { [field]: nextValue });
  }

  function resetCreateForm() {
    setNewTeamName("");
    setNewTeamNumber("");
    setNewTeamDiscordServerId("");
    setNewTeamDiscordRoleId("");
  }

  async function handleCreateTeam(event: FormEvent) {
    event.preventDefault();

    const name = newTeamName.trim();
    const number = newTeamNumber.trim().toUpperCase();

    if (!name || !number) {
      onError("Team name and number are required.");
      return;
    }

    onError(null);
    setIsCreatingTeam(true);

    try {
      const response = await fetch("/api/admin/create-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          number,
          discordServerId: newTeamDiscordServerId.trim() || null,
          discordRoleId: newTeamDiscordRoleId.trim() || null,
        }),
      });

      const payload = (await response.json()) as AdminTeamRow & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create team.");
      }

      onTeamCreated(payload);
      resetCreateForm();
      setShowAddTeamForm(false);
    } catch (createError) {
      onError(
        createError instanceof Error
          ? createError.message
          : "Failed to create team.",
      );
    } finally {
      setIsCreatingTeam(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <AdminStatChip
            icon={Building2}
            label={`${teams.length} team${teams.length === 1 ? "" : "s"}`}
            variant="accent"
          />
          <AdminStatChip
            icon={Server}
            label={`${discordLinkedCount} Discord linked`}
            variant={discordLinkedCount > 0 ? "success" : "default"}
          />
        </div>

        <Button
          type="button"
          size="sm"
          variant={showAddTeamForm ? "outline" : "default"}
          className={cn(
            !showAddTeamForm &&
              "shadow-md shadow-blue-600/20 motion-safe:transition-transform motion-safe:hover:scale-[1.02]",
          )}
          onClick={() => {
            if (showAddTeamForm) {
              resetCreateForm();
            }
            setShowAddTeamForm((current) => !current);
          }}
        >
          {showAddTeamForm ? (
            <>
              <X data-icon="inline-start" />
              Cancel
            </>
          ) : (
            <>
              <Plus data-icon="inline-start" />
              Add team
            </>
          )}
        </Button>
      </div>

      {showAddTeamForm ? (
        <Card
          className={cn(
            "border-slate-800/80 bg-slate-950/40 shadow-md backdrop-blur-sm",
            "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-300",
            "motion-reduce:animate-none",
          )}
        >
          <CardHeader className="border-b border-slate-800/80">
            <CardTitle className="flex items-center gap-2 text-base text-slate-100">
              <Building2 className="size-4 text-blue-400" />
              Create team
            </CardTitle>
            <CardDescription className="text-slate-500">
              Add a new VEX team identity and optional Discord integration IDs.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleCreateTeam}>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-team-name">Team name</Label>
                <Input
                  id="new-team-name"
                  required
                  value={newTeamName}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setNewTeamName(event.target.value)
                  }
                  disabled={isCreatingTeam}
                  placeholder="Iron Reign Robotics"
                  className={adminInlineInputClassName}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="new-team-number">Team number</Label>
                <div className="relative">
                  <Hash className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="new-team-number"
                    required
                    value={newTeamNumber}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setNewTeamNumber(event.target.value)
                    }
                    disabled={isCreatingTeam}
                    className={cn(adminInlineInputClassName, "pl-9 font-mono")}
                    placeholder="604A"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2">
                <Separator className="bg-slate-800/80" />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="new-team-server-id">Discord server ID</Label>
                <div className="relative">
                  <Server className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="new-team-server-id"
                    value={newTeamDiscordServerId}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setNewTeamDiscordServerId(event.target.value)
                    }
                    disabled={isCreatingTeam}
                    className={cn(adminInlineInputClassName, "pl-9 font-mono text-xs")}
                    placeholder="Optional guild snowflake"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="new-team-role-id">Discord role ID</Label>
                <div className="relative">
                  <Shield className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="new-team-role-id"
                    value={newTeamDiscordRoleId}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setNewTeamDiscordRoleId(event.target.value)
                    }
                    disabled={isCreatingTeam}
                    className={cn(adminInlineInputClassName, "pl-9 font-mono text-xs")}
                    placeholder="Optional role snowflake"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="justify-end border-t border-slate-800/80">
              <Button type="submit" disabled={isCreatingTeam}>
                {isCreatingTeam ? "Creating…" : "Create team"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : null}

      <AdminTableFrame>
        <Table className="min-w-[44rem]">
          <TableHeader>
            <TableRow className="border-slate-800/80 hover:bg-transparent">
              <TableHead className={cn(adminTableHeadClassName, "w-[14rem]")}>
                Team
              </TableHead>
              <TableHead className={cn(adminTableHeadClassName, "w-[8rem]")}>
                Number
              </TableHead>
              <TableHead className={adminTableHeadClassName}>
                Discord server ID
              </TableHead>
              <TableHead className={adminTableHeadClassName}>
                Discord role ID
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4}>
                  <AdminEmptyState
                    icon={Building2}
                    title="No teams yet"
                    description="Create your first team to start assigning users and Discord integrations."
                  />
                </TableCell>
              </TableRow>
            ) : (
              teams.map((team, index) => {
                const isPending = pendingTeamId === team.id;
                const hasDiscord =
                  Boolean(team.discordServerId) && Boolean(team.discordRoleId);

                return (
                  <TableRow
                    key={team.id}
                    className={cn(adminTableRowClassName, isPending && "opacity-60")}
                    style={{ animationDelay: `${index * 35}ms` } as CSSProperties}
                  >
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {isPending ? (
                          <Skeleton className="h-9 w-full rounded-md bg-slate-800/60" />
                        ) : (
                          <Input
                            defaultValue={team.name}
                            key={`${team.id}-name-${team.name}`}
                            onBlur={(event: FocusEvent<HTMLInputElement>) =>
                              handleTeamFieldBlur(team, "name", event.target.value)
                            }
                            className={adminInlineInputClassName}
                            aria-label={`Name for team ${team.number}`}
                          />
                        )}
                        {discordLinkBadge(hasDiscord)}
                      </div>
                    </TableCell>

                    <TableCell>
                      {isPending ? (
                        <Skeleton className="h-9 w-full rounded-md bg-slate-800/60" />
                      ) : (
                        <div className="relative">
                          <Hash className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500" />
                          <Input
                            defaultValue={team.number}
                            key={`${team.id}-number-${team.number}`}
                            onBlur={(event: FocusEvent<HTMLInputElement>) =>
                              handleTeamFieldBlur(team, "number", event.target.value)
                            }
                            className={cn(adminInlineInputClassName, "pl-8 font-mono")}
                            aria-label={`Number for team ${team.name}`}
                          />
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {isPending ? (
                        <Skeleton className="h-9 w-full rounded-md bg-slate-800/60" />
                      ) : (
                        <div className="relative">
                          <Server className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500" />
                          <Input
                            defaultValue={team.discordServerId ?? ""}
                            key={`${team.id}-server-${team.discordServerId ?? ""}`}
                            onBlur={(event: FocusEvent<HTMLInputElement>) =>
                              handleTeamFieldBlur(
                                team,
                                "discordServerId",
                                event.target.value,
                              )
                            }
                            className={cn(
                              adminInlineInputClassName,
                              "pl-8 font-mono text-xs",
                            )}
                            placeholder="Not set"
                            aria-label={`Discord server ID for team ${team.number}`}
                          />
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {isPending ? (
                        <Skeleton className="h-9 w-full rounded-md bg-slate-800/60" />
                      ) : (
                        <div className="relative">
                          <Shield className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500" />
                          <Input
                            defaultValue={team.discordRoleId ?? ""}
                            key={`${team.id}-role-${team.discordRoleId ?? ""}`}
                            onBlur={(event: FocusEvent<HTMLInputElement>) =>
                              handleTeamFieldBlur(
                                team,
                                "discordRoleId",
                                event.target.value,
                              )
                            }
                            className={cn(
                              adminInlineInputClassName,
                              "pl-8 font-mono text-xs",
                            )}
                            placeholder="Not set"
                            aria-label={`Discord role ID for team ${team.number}`}
                          />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </AdminTableFrame>
    </div>
  );
}
