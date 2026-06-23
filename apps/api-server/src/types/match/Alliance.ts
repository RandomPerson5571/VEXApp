import { IdInfo } from "../IdInfo.js";

export interface Alliance {
  color: "red" | "blue";
  score: number;
  teams: AllianceTeam[];
}

export interface AllianceTeam {
  team: IdInfo;
  sitting: boolean; // True if the team is benched/sitting out for this match (in 3-team alliances)
}