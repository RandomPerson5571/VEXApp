import { IdInfo } from "../IdInfo.js";
import { ClassificationType, DesignationType } from "./ClassificationTypes.js";
import { TeamAwardWinner } from "./TeamAwardWinner.js";

export interface VexAwardResponse {
  id: number;
  event: IdInfo;
  order: number; // Sorting order of the award on the page layout
  title: string; // e.g., "Excellence Award (VRC)", "Design Award"
  qualifications: string[]; // List of paths this award qualifies for (e.g. Worlds)
  designation: DesignationType | null;
  classification: ClassificationType | null;
  teamWinners: TeamAwardWinner[];
  individualWinners: string[]; // Used for volunteer, coach, or individual awards
}
