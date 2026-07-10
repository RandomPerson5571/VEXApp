import type { UseQueryResult } from "@tanstack/react-query";

export function isQueryInitiallyLoading<T>(
  query: Pick<UseQueryResult<T>, "data" | "isPending">,
) {
  return query.isPending && query.data === undefined;
}
