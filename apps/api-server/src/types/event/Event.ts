import { Division } from "../Division.js";
import { IdInfo } from "../IdInfo.js";
import { EventLevel, EventType } from "./EventType.js";

export interface VexEventResponse {
  id: number;
  sku: string;
  name: string;
  start: string; // ISO 8601 date-time string
  end: string;   // ISO 8601 date-time string
  season: IdInfo;
  program: IdInfo;
  location: Location;
  locations: Location[];
  divisions: Division[];
  level: EventLevel;
  ongoing: boolean;
  awards_finalized: boolean;
  event_type: EventType;
}
