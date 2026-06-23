// --- Explicit Type Aliases for Your API Codebase ---
import { VexAwardResponse } from "../award/Award.js";
import { VexEventResponse } from "../event/Event.js";
import { VexMatchResponse } from "../match/Match.js";
import { VexRankingResponse } from "../rankings/Ranking.js";
import { VexSeasonResponse } from "../season/Season.js";
import { VexSkillResponse } from "../skills/Skill.js";
import { VexTeamResponse } from "../team/Team.js";
import { RobotEventsPaginatedResponse } from "./PaginationMeta.js";

export type PaginatedTeam    = RobotEventsPaginatedResponse<VexTeamResponse>;
export type PaginatedEvent   = RobotEventsPaginatedResponse<VexEventResponse>;
export type PaginatedAward   = RobotEventsPaginatedResponse<VexAwardResponse>;
export type PaginatedSeason  = RobotEventsPaginatedResponse<VexSeasonResponse>;
export type PaginatedRanking = RobotEventsPaginatedResponse<VexRankingResponse>;
export type PaginatedMatch   = RobotEventsPaginatedResponse<VexMatchResponse>;
export type PaginatedSkill   = RobotEventsPaginatedResponse<VexSkillResponse>;

// Bonus: Program definition layout if you have it
export type PaginatedProgram = RobotEventsPaginatedResponse<{
  id: number;
  name: string;
  code: string | null;
}>;