import { IdInfo } from "../IdInfo.js";

export interface VexRankingResponse {
  id: number;
  event: IdInfo;
  division: IdInfo;
  rank: number;
  team: IdInfo;
  wins: number;
  losses: number;
  ties: number;
  wp: number; // Win Points
  ap: number; // Autonomous Points
  sp: number; // Strength Points (Tiebreaker points based on losing alliance scores)
  high_score: number;
  average_points: number;
  total_points: number;
}