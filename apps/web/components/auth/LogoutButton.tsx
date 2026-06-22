"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";

import { signOut } from "@/app/(auth)/actions/auth";
import { createClient } from "@/lib/supabase/client";

type LogoutButtonProps = {
  className?: string;
  iconClassName?: string;
  label?: string;
  pendingLabel?: string;
  showIcon?: boolean;
  onSignOut?: () => void;
};

export function LogoutButton({
  className,
  iconClassName = "h-4.5 w-4.5",
  label = "Sign out",
  pendingLabel = "Signing out...",
  showIcon = true,
  onSignOut,
}: LogoutButtonProps) {
  const [pending, startTransition] = useTransition();

  const handleSignOut = () => {
    onSignOut?.();
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      await signOut();
    });
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className={className}
    >
      {showIcon && <LogOut className={iconClassName} />}
      {pending ? pendingLabel : label}
    </button>
  );
}
