"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Clock3, Users } from "lucide-react";

import { DiscordLinkForm } from "@/app/(dashboard)/settings/discord-link-form";
import { PasswordResetForm } from "@/app/(dashboard)/settings/password-reset-form";
import { DeleteAccountButton } from "@/components/auth/DeleteAccountButton";
import { LogoutButton } from "@/components/auth/LogoutButton";

import { SettingsSection } from "./SettingsSection";

type ProfileSettingsViewProps = {
  firstName: string;
  lastName: string;
  email: string;
  linkedDiscordId: string | null;
  teamName: string | null;
  teamNumber: string | null;
  message?: string | null;
  error?: string | null;
};

type ProfileUpdateResponse = {
  profile?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  message?: string;
  error?: string;
};

const inputClassName =
  "w-full px-3 py-2.5 bg-slate-950/80 border border-slate-900 rounded-lg text-sm text-slate-200 font-semibold placeholder:text-slate-600 transition focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20";

const labelClassName =
  "text-[10px] text-slate-400 uppercase tracking-wider font-bold block";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function ProfileSettingsView({
  firstName,
  lastName,
  email,
  linkedDiscordId,
  teamName,
  teamNumber,
  message,
  error,
}: ProfileSettingsViewProps) {
  const router = useRouter();
  const [savedFirstName, setSavedFirstName] = useState(firstName);
  const [savedLastName, setSavedLastName] = useState(lastName);
  const [savedEmail, setSavedEmail] = useState(email);
  const [draftFirstName, setDraftFirstName] = useState(firstName);
  const [draftLastName, setDraftLastName] = useState(lastName);
  const [draftEmail, setDraftEmail] = useState(email);
  const [isSaving, setIsSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    setSavedFirstName(firstName);
    setSavedLastName(lastName);
    setSavedEmail(email);
    setDraftFirstName(firstName);
    setDraftLastName(lastName);
    setDraftEmail(email);
  }, [email, firstName, lastName]);

  const isDirty = useMemo(
    () =>
      draftFirstName.trim() !== savedFirstName ||
      draftLastName.trim() !== savedLastName ||
      normalizeEmail(draftEmail) !== normalizeEmail(savedEmail),
    [
      draftEmail,
      draftFirstName,
      draftLastName,
      savedEmail,
      savedFirstName,
      savedLastName,
    ],
  );

  const teamLabel =
    teamName && teamNumber
      ? `${teamName} (${teamNumber})`
      : teamName ?? "No team assigned";

  const resetDraft = () => {
    setDraftFirstName(savedFirstName);
    setDraftLastName(savedLastName);
    setDraftEmail(savedEmail);
    setProfileMessage(null);
    setProfileError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isDirty || isSaving) {
      return;
    }

    setIsSaving(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: draftFirstName,
          lastName: draftLastName,
          email: draftEmail,
        }),
      });

      const payload = (await response.json()) as ProfileUpdateResponse;

      if (!response.ok) {
        setProfileError(payload.error ?? "Unable to save profile changes.");
        return;
      }

      if (payload.profile) {
        setSavedFirstName(payload.profile.firstName);
        setSavedLastName(payload.profile.lastName);
        setSavedEmail(payload.profile.email);
        setDraftFirstName(payload.profile.firstName);
        setDraftLastName(payload.profile.lastName);
        setDraftEmail(payload.profile.email);
      }

      setProfileMessage(payload.message ?? "Profile updated successfully.");
      router.refresh();
    } catch {
      setProfileError("Unable to save profile changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-100 tracking-tight">
          Profile
        </h1>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Update your identity, security preferences, and account controls.
        </p>
      </div>

      <SettingsSection
        title="Personal Information"
        description="Change how your name and email appear across the team hub."
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="first-name" className={labelClassName}>
                First Name
              </label>
              <input
                id="first-name"
                type="text"
                value={draftFirstName}
                onChange={(event) => setDraftFirstName(event.target.value)}
                className={inputClassName}
                autoComplete="given-name"
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="last-name" className={labelClassName}>
                Last Name
              </label>
              <input
                id="last-name"
                type="text"
                value={draftLastName}
                onChange={(event) => setDraftLastName(event.target.value)}
                className={inputClassName}
                autoComplete="family-name"
                maxLength={100}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className={labelClassName}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={draftEmail}
              onChange={(event) => setDraftEmail(event.target.value)}
              className={inputClassName}
              autoComplete="email"
              required
            />
          </div>

          {profileError ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3.5 py-2.5 text-sm text-red-300">
              {profileError}
            </div>
          ) : null}
          {profileMessage ? (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 text-sm text-emerald-300">
              {profileMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-900/60 pt-4">
            <button
              type="submit"
              disabled={!isDirty || isSaving}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold tracking-wide transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-600/40 disabled:text-blue-200/70"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={resetDraft}
              disabled={!isDirty || isSaving}
              className="px-4 py-2 rounded-lg border border-slate-900 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:border-slate-800 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </form>
      </SettingsSection>

      <SettingsSection
        title="Discord"
        description="Connect your account for bot verification and server role assignment."
      >
        <DiscordLinkForm
          linkedDiscordId={linkedDiscordId}
          message={message}
          error={error}
          returnTo="/settings/profile"
          embedded
        />
      </SettingsSection>

      <SettingsSection
        title="Account Details"
        description="Manage sign-in credentials and authentication methods."
      >
        <PasswordResetForm email={email} />
      </SettingsSection>

      <SettingsSection
        title="Team Change Request"
        description="Request a transfer to a different team. Requires admin approval."
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 border border-slate-900 text-slate-500">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-200">Current team</p>
              <p className="text-xs text-slate-400">{teamLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-400">
              <Clock3 className="h-3 w-3" />
              Coming soon
            </span>
            <button
              type="button"
              disabled
              className="rounded-lg border border-slate-900 px-4 py-2 text-xs font-bold text-slate-600 cursor-not-allowed"
            >
              Request Transfer
            </button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        variant="danger"
        title="Danger"
        description="Irreversible actions that affect your account access."
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-red-500/15 bg-red-950/20 px-4 py-4">
            <div>
              <p className="text-sm font-bold text-red-300">Delete account</p>
              <p className="mt-1 text-xs text-red-400/70 leading-relaxed">
                Permanently remove your profile, team memberships, and linked
                integrations. This cannot be undone.
              </p>
            </div>
            <DeleteAccountButton
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-red-500/15 bg-red-950/20 px-4 py-4">
            <div>
              <p className="text-sm font-bold text-red-300">Log out</p>
              <p className="mt-1 text-xs text-red-400/70">
                End your current session on this device.
              </p>
            </div>
            <LogoutButton
              label="Log Out"
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition shrink-0"
              iconClassName="h-4 w-4"
            />
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
