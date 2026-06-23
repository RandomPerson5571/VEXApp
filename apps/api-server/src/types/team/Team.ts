import { IdInfo } from "../IdInfo.js";
import { Grade } from "./Grade.js";

export interface VexTeamResponse {
  id: number;
  number: string;
  team_name: string;
  robot_name: string | null;
  organization: string;
  location: Location;
  registered: boolean;
  program: IdInfo;
  grade: Grade;
}
