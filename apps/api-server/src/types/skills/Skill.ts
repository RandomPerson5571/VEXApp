import { IdInfo } from "../IdInfo.js";
import { SkillType } from "./SkillType.js";

export interface VexSkillResponse {
  id: number;
  event: IdInfo;
  team: IdInfo;
  type: SkillType;
  season: IdInfo;
  division: IdInfo;
  rank: number;
  score: number;
  attempts: number;
}