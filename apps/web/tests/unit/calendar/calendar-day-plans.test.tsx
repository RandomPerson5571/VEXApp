// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CalendarMonthGrid } from "@/components/calendar/CalendarMonthGrid";
import { CalendarScheduleGrid } from "@/components/calendar/CalendarScheduleGrid";
import { CalendarSidePanel } from "@/components/calendar/CalendarSidePanel";
import type { CalendarEvent, TeamDayPlan } from "@/lib/types/team";

const SELECTED_DATE = "2026-07-06";
const CALENDAR_CELL = {
  day: 6,
  isCurrentMonth: true,
  dateStr: SELECTED_DATE,
};

const TIMED_EVENT: CalendarEvent = {
  id: "ev-1",
  title: "Driver Practice",
  date: SELECTED_DATE,
  startTime: "4:30 PM",
  endTime: "6:30 PM",
  type: "build",
};

function buildPlan(type: TeamDayPlan["type"], id = "plan-1"): TeamDayPlan {
  return { id, date: SELECTED_DATE, type };
}

describe("calendar day plans UI", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("shows a Build icon on the month cell after setting Build", async () => {
    const onSetDayPlan = vi.fn();
    const onClearDayPlan = vi.fn();
    let selectedDayPlan: TeamDayPlan | undefined;

    const renderCalendar = () => {
      const dayPlansByDate = selectedDayPlan
        ? new Map([[SELECTED_DATE, selectedDayPlan]])
        : new Map<string, TeamDayPlan>();

      act(() => {
        root.render(
          <>
            <CalendarSidePanel
              selectedDate={SELECTED_DATE}
              selectedDayPlan={selectedDayPlan}
              selectedDayEvents={[TIMED_EVENT]}
              isDayPlanPending={false}
              onSetDayPlan={(type) => {
                onSetDayPlan(type);
                selectedDayPlan = buildPlan(type);
                renderCalendar();
              }}
              onClearDayPlan={() => {
                onClearDayPlan();
                selectedDayPlan = undefined;
                renderCalendar();
              }}
              onAddEvent={() => undefined}
            />
            <CalendarMonthGrid
              calendarDays={[CALENDAR_CELL]}
              eventsByDate={new Map([[SELECTED_DATE, [TIMED_EVENT]]])}
              dayPlansByDate={dayPlansByDate}
              selectedDate={SELECTED_DATE}
              todayStr="2026-07-01"
              onSelectDate={() => undefined}
            />
          </>,
        );
      });
    };

    renderCalendar();

    const buildButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Build",
    );
    expect(buildButton).toBeDefined();
    await act(async () => {
      buildButton?.click();
    });

    expect(onSetDayPlan).toHaveBeenCalledWith("build");
    expect(container.querySelector('[aria-label="Build"]')).not.toBeNull();
    expect(container.textContent).toContain("Driver Practice");
  });

  it("changes the icon to Testing and clears it on clear", async () => {
    let selectedDayPlan: TeamDayPlan | undefined = buildPlan("build");

    const renderCalendar = () => {
      const dayPlansByDate = selectedDayPlan
        ? new Map([[SELECTED_DATE, selectedDayPlan]])
        : new Map<string, TeamDayPlan>();

      act(() => {
        root.render(
          <>
            <CalendarSidePanel
              selectedDate={SELECTED_DATE}
              selectedDayPlan={selectedDayPlan}
              selectedDayEvents={[TIMED_EVENT]}
              isDayPlanPending={false}
              onSetDayPlan={(type) => {
                selectedDayPlan = buildPlan(type);
                renderCalendar();
              }}
              onClearDayPlan={() => {
                selectedDayPlan = undefined;
                renderCalendar();
              }}
              onAddEvent={() => undefined}
            />
            <CalendarMonthGrid
              calendarDays={[CALENDAR_CELL]}
              eventsByDate={new Map([[SELECTED_DATE, [TIMED_EVENT]]])}
              dayPlansByDate={dayPlansByDate}
              selectedDate={SELECTED_DATE}
              todayStr="2026-07-01"
              onSelectDate={() => undefined}
            />
          </>,
        );
      });
    };

    renderCalendar();
    expect(container.querySelector('[aria-label="Build"]')).not.toBeNull();

    const testingButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Testing",
    );
    await act(async () => {
      testingButton?.click();
    });

    expect(container.querySelector('[aria-label="Testing"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Build"]')).toBeNull();

    const clearButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Clear"),
    );
    await act(async () => {
      clearButton?.click();
    });

    const monthCell = Array.from(container.querySelectorAll("button")).find(
      (button) =>
        button.textContent?.includes("6") &&
        button.textContent?.includes("Driver Practice"),
    );

    expect(monthCell?.textContent).toContain("Driver Practice");
    expect(monthCell?.querySelector('[aria-label="Build"]')).toBeNull();
    expect(monthCell?.querySelector('[aria-label="Testing"]')).toBeNull();
    expect(monthCell?.querySelector('[aria-label="Coding"]')).toBeNull();
    expect(container.textContent).not.toContain("Team focus set to");
  });

  it("keeps timed events on the same day when day plan icons change", async () => {
    const eventsByDate = new Map([[SELECTED_DATE, [TIMED_EVENT]]]);
    const plans: TeamDayPlan[] = [buildPlan("build")];

    const renderGrid = (dayPlans: TeamDayPlan[]) => {
      const dayPlansByDate = new Map(dayPlans.map((plan) => [plan.date, plan]));

      act(() => {
        root.render(
          <CalendarMonthGrid
            calendarDays={[CALENDAR_CELL]}
            eventsByDate={eventsByDate}
            dayPlansByDate={dayPlansByDate}
            selectedDate={SELECTED_DATE}
            todayStr="2026-07-01"
            onSelectDate={() => undefined}
          />,
        );
      });
    };

    renderGrid(plans);
    expect(container.textContent).toContain("Driver Practice");
    expect(container.querySelector('[aria-label="Build"]')).not.toBeNull();

    renderGrid([buildPlan("testing")]);
    expect(container.textContent).toContain("Driver Practice");
    expect(container.querySelector('[aria-label="Testing"]')).not.toBeNull();

    renderGrid([]);
    expect(container.textContent).toContain("Driver Practice");
    expect(container.querySelector('[aria-label="Testing"]')).toBeNull();
  });

  it("shows day plan icon and keeps events in week schedule view", () => {
    act(() => {
      root.render(
        <CalendarScheduleGrid
          mode="week"
          days={[CALENDAR_CELL]}
          eventsByDate={new Map([[SELECTED_DATE, [TIMED_EVENT]]])}
          dayPlansByDate={new Map([[SELECTED_DATE, buildPlan("build")]])}
          selectedDate={SELECTED_DATE}
          todayStr="2026-07-01"
          onSelectDate={() => undefined}
        />,
      );
    });

    expect(container.querySelector('[aria-label="Build"]')).not.toBeNull();
    expect(container.textContent).toContain("Driver Practice");
  });
});
