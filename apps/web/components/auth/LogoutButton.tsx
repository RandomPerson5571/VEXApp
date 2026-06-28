"use client";

import { LogOut } from "lucide-react";
import { useState, useTransition } from "react";

import { signOut } from "@/app/(auth)/actions/auth";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { createClient } from "@/lib/supabase/client";

type LogoutButtonProps = {
  className?: string;
  iconClassName?: string;
  label?: string;
  pendingLabel?: string;
  showIcon?: boolean;
  onSignOut?: () => void;
  requireConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationDescription?: string;
};

export function LogoutButton({
  className,
  iconClassName = "h-4.5 w-4.5",
  label = "Sign out",
  pendingLabel = "Signing out...",
  showIcon = true,
  onSignOut,
  requireConfirmation = true,
  confirmationTitle = "Log out?",
  confirmationDescription = "You will be signed out of your account on this device.",
}: LogoutButtonProps) {
  const [pending, startTransition] = useTransition();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const performSignOut = () => {
    onSignOut?.();
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      await signOut();
    });
  };

  const handleClick = () => {
    if (requireConfirmation) {
      setShowConfirmation(true);
      return;
    }

    performSignOut();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={className}
      >
        {showIcon && <LogOut className={iconClassName} />}
        {pending ? pendingLabel : label}
      </button>

      <ConfirmationDialog
        isOpen={showConfirmation}
        title={confirmationTitle}
        description={confirmationDescription}
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        variant="danger"
        pending={pending}
        pendingLabel={pendingLabel}
        icon={<LogOut className="h-5 w-5 text-red-400" />}
        onClose={() => {
          if (!pending) {
            setShowConfirmation(false);
          }
        }}
        onConfirm={() => {
          setShowConfirmation(false);
          performSignOut();
        }}
      />
    </>
  );
}
