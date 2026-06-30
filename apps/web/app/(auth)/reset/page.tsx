import { ResetClient } from "./reset-client";

type ResetPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function ResetPage({ searchParams }: ResetPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return <ResetClient initialError={resolvedSearchParams?.error ?? null} />;
}
