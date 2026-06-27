import { FileText } from "lucide-react";

import { DocsView } from "@/components/documents/DocsView";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getLatestDocumentationForTeam } from "@/lib/data/documentation";
import { toDesignNotebookEntry } from "@/lib/mappers/documentation";

function DocumentsFallback({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-[#03070e] p-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-900 bg-[#090e18]/80 p-8 text-center shadow-md">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-800 bg-slate-900/60">
          <FileText className="h-7 w-7 text-slate-400" />
        </div>
        <h1 className="text-xl font-black text-slate-100">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
}

export default async function DocumentsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.profile.teamId) {
    return (
      <DocumentsFallback
        title="No team assigned"
        description="Join or select a team to view design notebook documentation."
      />
    );
  }

  try {
    const doc = await getLatestDocumentationForTeam(currentUser.profile.teamId);

    if (!doc) {
      return (
        <DocumentsFallback
          title="No documents yet"
          description="Your team has not published any design notebook entries."
        />
      );
    }

    return <DocsView notebookEntry={toDesignNotebookEntry(doc)} />;
  } catch (error) {
    console.error("Failed to load documentation:", error);

    return (
      <DocumentsFallback
        title="Unable to load documents"
        description="Something went wrong while loading your team's documentation. Please try again later."
      />
    );
  }
}
