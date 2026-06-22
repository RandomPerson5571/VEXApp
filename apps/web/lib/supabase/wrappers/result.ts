import type { PostgrestError } from "@supabase/supabase-js";

import { SupabaseWrapperError } from "./errors";

export function unwrap<T>(
  data: T | null,
  error: PostgrestError | null,
  model: string,
): T {
  if (error) {
    throw new SupabaseWrapperError(model, error);
  }

  if (data === null) {
    throw new SupabaseWrapperError(model, {
      message: "Expected data but received null",
      code: "PGRST116",
      details: "",
      hint: "",
    } as PostgrestError);
  }

  return data;
}

export function unwrapNullable<T>(
  data: T | null,
  error: PostgrestError | null,
  model: string,
): T | null {
  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new SupabaseWrapperError(model, error);
  }

  return data;
}

export function parseDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function parseDates<T extends Record<string, unknown>, K extends keyof T>(
  row: T,
  keys: K[],
): T {
  const parsed = { ...row };

  for (const key of keys) {
    const value = parsed[key];
    if (typeof value === "string") {
      parsed[key] = parseDate(value) as T[K];
    }
  }

  return parsed;
}
