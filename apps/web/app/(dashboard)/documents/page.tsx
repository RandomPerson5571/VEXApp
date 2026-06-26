import { DocsView } from "@/components/documents/DocsView";
import { mockWeek2DesignEntry } from "@/lib/mock/dashboard";
import { toDesignNotebookEntry } from "@/lib/supabase/mappers/documentation";
import { createClient } from "@/lib/supabase/server";
import { getDocWithAuthors, listDocsInFolder, listFolders } from "@/lib/supabase/wrappers";

export default async function DocumentsPage() {
  const supabase = await createClient();
  let notebookEntry = mockWeek2DesignEntry;

  try {
    const folders = await listFolders(supabase);
    const firstFolder = folders[0];

    if (firstFolder) {
      const docs = await listDocsInFolder(supabase, firstFolder.id);
      const firstDoc = docs[0];

      if (firstDoc) {
        const doc = await getDocWithAuthors(supabase, firstDoc.id);
        notebookEntry = toDesignNotebookEntry(doc);
      }
    }
  } catch {
    notebookEntry = mockWeek2DesignEntry;
  }

  return <DocsView notebookEntry={notebookEntry} />;
}
