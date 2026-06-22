import { DocsView } from "@/components/documents/DocsView";
import { mockWeek2DesignEntry } from "@/lib/mock/dashboard";

export default function DocumentsPage() {
  return <DocsView notebookEntry={mockWeek2DesignEntry} />;
}
