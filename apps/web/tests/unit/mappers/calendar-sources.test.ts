import { describe, expect, it } from "vitest";

import {
  calendarSourcesWarning,
  resolveCalendarSourcesStatus,
} from "@/lib/mappers/calendar-sources";

describe("resolveCalendarSourcesStatus", () => {
  it("is loading while either source is pending", () => {
    expect(
      resolveCalendarSourcesStatus({
        teamPending: true,
        teamError: false,
        robotPending: false,
        robotError: false,
        robotConfigured: true,
        robotAvailable: true,
      }),
    ).toBe("loading");
  });

  it("merges as ok when both succeed", () => {
    expect(
      resolveCalendarSourcesStatus({
        teamPending: false,
        teamError: false,
        robotPending: false,
        robotError: false,
        robotConfigured: true,
        robotAvailable: true,
      }),
    ).toBe("ok");
  });

  it("degrades when team fails but RobotEvents works", () => {
    expect(
      resolveCalendarSourcesStatus({
        teamPending: false,
        teamError: true,
        robotPending: false,
        robotError: false,
        robotConfigured: true,
        robotAvailable: true,
      }),
    ).toBe("team-unavailable");
  });

  it("degrades when RobotEvents soft-fails", () => {
    expect(
      resolveCalendarSourcesStatus({
        teamPending: false,
        teamError: false,
        robotPending: false,
        robotError: false,
        robotConfigured: true,
        robotAvailable: false,
      }),
    ).toBe("robotevents-unavailable");
  });

  it("returns both-unavailable when neither source works", () => {
    expect(
      resolveCalendarSourcesStatus({
        teamPending: false,
        teamError: true,
        robotPending: false,
        robotError: true,
        robotConfigured: true,
        robotAvailable: false,
      }),
    ).toBe("both-unavailable");
  });

  it("treats missing token as unconfigured, not hard failure", () => {
    expect(
      resolveCalendarSourcesStatus({
        teamPending: false,
        teamError: false,
        robotPending: false,
        robotError: false,
        robotConfigured: false,
        robotAvailable: false,
      }),
    ).toBe("robotevents-unconfigured");
  });
});

describe("calendarSourcesWarning", () => {
  it("returns copy for partial failures", () => {
    expect(calendarSourcesWarning("team-unavailable")).toMatch(/Team schedule/);
    expect(calendarSourcesWarning("robotevents-unavailable")).toMatch(
      /Official event data/,
    );
    expect(calendarSourcesWarning("ok")).toBeNull();
  });
});
