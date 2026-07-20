import { redirect } from "next/navigation";

type SettingsProfileRedirectProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

export default async function SettingsProfileRedirect({
  searchParams,
}: SettingsProfileRedirectProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.message) qs.set("message", params.message);
  if (params.error) qs.set("error", params.error);
  const query = qs.toString();
  redirect(query ? `/settings?${query}` : "/settings");
}
