import { IdInfo } from "../IdInfo.js";

export interface VexSeasonResponse {
  id: number;
  name: string; // e.g., "VRC 2024-2025: High Stakes"
  program: IdInfo;
  start: string; // ISO 8601 date-time string
  end: string;   // ISO 8601 date-time string
  years_start: number; // The calendar year the season began (e.g., 2024)
  years_end: number;   // The calendar year the season finished (e.g., 2025)
}