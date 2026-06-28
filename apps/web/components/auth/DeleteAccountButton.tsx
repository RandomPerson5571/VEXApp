"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { signOut } from "@/app/(auth)/actions/auth";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { createClient } from "@/lib/supabase/client";

type DeleteAccountButtonProps = {
  className?: string;
  iconClassName?: string;
  label?: string;
  pendingLabel?: string;
  showIcon?: boolean;
};

type DeleteAccountResponse = {
  message?: string;
  error?: string;
};

export function DeleteAccountButton({
  className,
  iconClassName = "h-4 w-4",
  label = "Delete Account",
  pendingLabel = "Deleting...",
  showIcon = true,
}: DeleteAccountButtonProps) {
  const [pending, startTransition] = useTransition();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/profile", {
          method: "DELETE",
        });

        const payload = (await response.json()) as DeleteAccountResponse;

        if (!response.ok) {
          setError(payload.error ?? "Unable to delete your account.");
          return;
        }

        const supabase = createClient();
        await supabase.auth.signOut();
        await signOut();
      } catch {
        setError("Unable to delete your account. Please try again.");
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <button
        type="button"
        onClick={() => {
          setError(null);
          setShowConfirmation(true);
        }}
        disabled={pending}
        className={className}
      >
        {showIcon && <Trash2 className={iconClassName} />}
        {pending ? pendingLabel : label}
      </button>

      {error ? (
        <p className="max-w-xs text-right text-xs font-semibold text-red-400">
          {error}
        </p>
      ) : null}

      <ConfirmationDialog
        isOpen={showConfirmation}
        title="Delete your account?"
        description="This permanently removes your profile, team memberships, and linked integrations. This action cannot be undone."
        confirmLabel="Delete account"
        cancelLabel="Keep account"
        variant="danger"
        pending={pending}
        pendingLabel={pendingLabel}
        icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
        onClose={() => {
          if (!pending) {
            setShowConfirmation(false);
            setError(null);
          }
        }}
        onConfirm={() => {
          setShowConfirmation(false);
          performDelete();
        }}
      />
    </div>
  );
}
