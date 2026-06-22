import { redirect } from "next/navigation";

import { getUser } from "@/app/(auth)/lib/session";
import { LoginClient } from "./login-client";

export default async function LoginPage() {
  const user = await getUser();
  if (user) {
    redirect("/dashboard");
  }

  return <LoginClient />;
}
