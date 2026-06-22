import type { SupabaseClient } from "@supabase/supabase-js";

import { unwrap } from "./result";
import { TABLES } from "./tables";
import type { Folder } from "./types";

export async function listFolders(
  supabase: SupabaseClient,
): Promise<Folder[]> {
  const { data, error } = await supabase
    .from(TABLES.folder)
    .select("*")
    .order("name", { ascending: true });

  return unwrap(data as Folder[] | null, error, TABLES.folder);
}

export async function getFolderById(
  supabase: SupabaseClient,
  folderId: string,
): Promise<Folder> {
  const { data, error } = await supabase
    .from(TABLES.folder)
    .select("*")
    .eq("id", folderId)
    .single();

  return unwrap(data as Folder, error, TABLES.folder);
}
