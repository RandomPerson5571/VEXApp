import type { PostgrestError } from "@supabase/supabase-js";

export class SupabaseWrapperError extends Error {
  readonly model: string;
  readonly code?: string;
  readonly details?: string;
  readonly hint?: string;

  constructor(model: string, error: PostgrestError) {
    super(`${model}: ${error.message}`);
    this.name = "SupabaseWrapperError";
    this.model = model;
    this.code = error.code;
    this.details = error.details;
    this.hint = error.hint;
  }
}
