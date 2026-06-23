export interface VexPaginationMeta {
  current_page: number;
  first_page_url: string;
  from: number | null; // Can be null if the result set is completely empty
  last_page: number;
  last_page_url: string;
  next_page_url: string | null; // Null if you are on the very last page
  path: string;
  per_page: number;
  prev_page_url: string | null; // Null if you are on the first page
  to: number | null;   // Can be null if the result set is completely empty
  total: number;
}

// Example wrapper of how this looks combined with your data:
export interface RobotEventsPaginatedResponse<T> {
  meta: VexPaginationMeta;
  data: T[];
}