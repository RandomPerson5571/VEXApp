import type { SupabaseClient } from "@supabase/supabase-js";

import { SupabaseWrapperError } from "./errors";
import { parseDates, unwrap } from "./result";
import { TABLES } from "./tables";
import type {
  DocType,
  Documentation,
  DocumentationWithRelations,
  Folder,
  User,
} from "./types";

const DOC_DATE_FIELDS = ["createdAt"] as const;
const USER_DATE_FIELDS = ["createdAt", "updatedAt"] as const;

type DocumentationRow = Omit<Documentation, "createdAt"> & {
  createdAt: string | Date;
};

type UserRow = Omit<User, "createdAt" | "updatedAt"> & {
  createdAt: string | Date;
  updatedAt: string | Date;
};

function parseDocumentation(row: DocumentationRow): Documentation {
  return parseDates(row, [...DOC_DATE_FIELDS]) as Documentation;
}

function parseUser(row: UserRow): User {
  return parseDates(row, [...USER_DATE_FIELDS]) as User;
}

export type CreateDocumentationInput = {
  title: string;
  type: DocType;
  content: string;
  folderId: string;
};

export type UpdateDocumentationInput = {
  title?: string;
  type?: DocType;
  content?: string;
  folderId?: string;
};

export async function listDocsInFolder(
  supabase: SupabaseClient,
  folderId: string,
): Promise<Documentation[]> {
  const { data, error } = await supabase
    .from(TABLES.documentation)
    .select("*")
    .eq("folderId", folderId)
    .order("createdAt", { ascending: false });

  const rows = unwrap(data as DocumentationRow[] | null, error, TABLES.documentation);
  return rows.map(parseDocumentation);
}

export async function getDocWithAuthors(
  supabase: SupabaseClient,
  docId: string,
): Promise<DocumentationWithRelations> {
  const { data, error } = await supabase
    .from(TABLES.documentation)
    .select("*, authors:User(*), folder:Folder(*)")
    .eq("id", docId)
    .single();

  const row = unwrap(data, error, TABLES.documentation) as DocumentationRow & {
    authors: UserRow[];
    folder: Folder;
  };

  return {
    ...parseDocumentation(row),
    authors: (row.authors ?? []).map(parseUser),
    folder: row.folder,
  };
}

export async function createDoc(
  supabase: SupabaseClient,
  input: CreateDocumentationInput,
): Promise<Documentation> {
  const { data, error } = await supabase
    .from(TABLES.documentation)
    .insert(input)
    .select("*")
    .single();

  return parseDocumentation(
    unwrap(data as DocumentationRow, error, TABLES.documentation),
  );
}

export async function updateDoc(
  supabase: SupabaseClient,
  docId: string,
  input: UpdateDocumentationInput,
): Promise<Documentation> {
  const { data, error } = await supabase
    .from(TABLES.documentation)
    .update(input)
    .eq("id", docId)
    .select("*")
    .single();

  return parseDocumentation(
    unwrap(data as DocumentationRow, error, TABLES.documentation),
  );
}

export async function linkAuthorToDoc(
  supabase: SupabaseClient,
  docId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase.from(TABLES.authoredDocs).insert({
    A: docId,
    B: userId,
  });

  if (error) {
    throw new SupabaseWrapperError(TABLES.authoredDocs, error);
  }
}
