import { redirect } from "next/navigation";

import { getUser } from "@/app/(auth)/lib/session";
import { verifySessionIdentity } from "@/lib/auth/identity";
import { lookupUserProfile } from "@/lib/auth/profile";
import { LoginClient } from "./login-client";

type LoginPageProps = {
  searchParams?: Promise<{ redirectTo?: string; message?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getUser();
  let dbUnavailable = false;

  if (user) {
    const profile = await lookupUserProfile(user.id);

    if (profile.status === "found") {
      const identity = await verifySessionIdentity(user);

      if (identity.ok) {
        redirect("/dashboard");
      }
    }

    if (profile.status === "missing") {
      redirect("/onboarding");
    }

    dbUnavailable = true;
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const message = dbUnavailable
    ? "Unable to reach the database. Check your connection settings and try again."
    : resolvedSearchParams?.message;

  return (
    <LoginClient
      searchParams={
        resolvedSearchParams || message
          ? { ...resolvedSearchParams, message }
          : undefined
      }
    />
  );
}
