import { IdInfo } from "../IdInfo.js";
import { Alliance } from "./Alliance.js";

export interface VexMatchResponse {
  id: number;
  event: IdInfo;
  division: IdInfo;
  round: number; // 1 = Practice, 2 = Quals, 3 = Quarterfinals, 4 = Semifinals, 5 = Finals, etc.
  instance: number;
  matchnum: number;
  scheduled: string | null; // ISO 8601 date-time string
  started: string | null;   // ISO 8601 date-time string
  field: string | null;
  scored: boolean;
  name: string; // e.g., "Qualifier #12" or "Finals 1-1"
  alliances: Alliance[];
}

