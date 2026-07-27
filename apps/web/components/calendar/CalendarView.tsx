"use client";

import { useEffect, useMemo, useState } from "react";
import type { CalendarEvent, DayPlanType, EventType } from "@/lib/types/team";
import { canManageTeamRoster } from "@/lib/auth/auth-guards";
import { useUserPermissions } from "@/lib/auth/use-user-permissions";
import { useTeam } from "@/components/providers/UserProvider";
import { isQueryInitiallyLoading } from "@/lib/hooks/use-query-loading";
import { useMergedCalendarSources } from "@/lib/hooks/use-merged-calendar-sources";
import { useTeamEventMutations } from "@/lib/hooks/use-team-event-mutations";
import { useTeamDayPlanMutations } from "@/lib/hooks/use-team-day-plan-mutations";
import { useTeamDayPlans } from "@/lib/hooks/use-team-day-plans";
import { isRobotEventsId } from "@/lib/mappers/upcoming-matches";
import { CalendarSourcesBanner } from "@/components/calendar/CalendarSourcesBanner";
import {
  addDaysToDateStr,
  formatMonthYear,
  formatSelectedDayLabel,
  formatWeekRange,
  getDaysInMonth,
  getDaysInWeek,
  getTodayDateStr,
  parseDateStr,
} from "@/lib/utils/calendar";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { CalendarEventModal } from "./CalendarEventModal";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarMonthGrid } from "./CalendarMonthGrid";
import { CalendarMonthToolbar } from "./CalendarMonthToolbar";
import { CalendarScheduleGrid } from "./CalendarScheduleGrid";
import { CalendarSidePanel } from "./CalendarSidePanel";
import type { CalendarViewMode } from "./calendarTypes";

const DEFAULT_LOCATION = "Iron Reign Workshop";

function resetEventFormDefaults() {
  return {
    title: "",
    startTime: "4:30 PM",
    endTime: "6:30 PM",
    type: "build" as EventType,
    location: DEFAULT_LOCATION,
    description: "",
    forAllTeams: false,
  };
}

export interface CalendarViewProps {
  initialSelectedDate?: string;
  onActivityLog?: (text: string, subtext: string, type: "schedule") => void;
}

export function CalendarView({
  initialSelectedDate = getTodayDateStr(),
  onActivityLog,
}: CalendarViewProps) {
  const team = useTeam();
  const permissions = useUserPermissions(team?.id);
  const canMakeGlobal = canManageTeamRoster(permissions);
  const {
    calendarEvents: events,
    status: sourcesStatus,
    warning: sourcesWarning,
    isInitialLoading: sourcesLoading,
  } = useMergedCalendarSources();

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEventId(null);
    setForAllTeams(false);
  };

  const {
    createMutation: createEventMutation,
    updateMutation: updateEventMutation,
    deleteMutation: deleteEventMutation,
  } = useTeamEventMutations({
    teamId: team?.id,
    onCreateSuccess: () => {
      closeModal();
      setTitle("");
      setDescription("");
    },
    onUpdateSuccess: closeModal,
    onDeleteSuccess: closeModal,
  });
  const dayPlansQuery = useTeamDayPlans();
  const { data: dayPlans = [] } = dayPlansQuery;
  const isInitialLoading =
    sourcesLoading || isQueryInitiallyLoading(dayPlansQuery);
  const { setDayPlan, clearDayPlan, isPending: isDayPlanPending, flush: flushDayPlans, cancel: cancelDayPlans } =
    useTeamDayPlanMutations();
  const [viewType, setViewType] = useState<CalendarViewMode>("month");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const [year, month] = initialSelectedDate.split("-").map(Number);
    return new Date(year, month - 1, 1);
  });
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isMobileDayOpen, setIsMobileDayOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(initialSelectedDate);
  const [startTime, setStartTime] = useState("4:30 PM");
  const [endTime, setEndTime] = useState("6:30 PM");
  const [type, setType] = useState<EventType>("build");
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [description, setDescription] = useState("");
  const [createdBy, setCreatedBy] = useState<string | undefined>();
  const [forAllTeams, setForAllTeams] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    return () => {
      flushDayPlans();
      cancelDayPlans();
    };
  }, [flushDayPlans, cancelDayPlans]);

  const todayStr = getTodayDateStr();
  const isEditMode = editingEventId !== null;
  const isModalBusy =
    createEventMutation.isPending ||
    updateEventMutation.isPending ||
    deleteEventMutation.isPending;

  const calendarDays = useMemo(
    () => getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth],
  );

  const weekDays = useMemo(() => getDaysInWeek(selectedDate), [selectedDate]);

  const dayCell = useMemo(() => {
    const date = parseDateStr(selectedDate);
    return [
      {
        day: date.getDate(),
        isCurrentMonth: true,
        dateStr: selectedDate,
      },
    ];
  }, [selectedDate]);

  const toolbarLabel = useMemo(() => {
    if (viewType === "month") return formatMonthYear(currentMonth);
    if (viewType === "week") return formatWeekRange(selectedDate);
    return formatSelectedDayLabel(selectedDate);
  }, [viewType, currentMonth, selectedDate]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const existing = map.get(event.date) ?? [];
      map.set(event.date, [...existing, event]);
    }
    return map;
  }, [events]);

  const dayPlansByDate = useMemo(() => {
    const map = new Map<string, (typeof dayPlans)[number]>();
    for (const plan of dayPlans) {
      map.set(plan.date, plan);
    }
    return map;
  }, [dayPlans]);

  const selectedDayEvents = eventsByDate.get(selectedDate) ?? [];

  const selectedDayPlan = dayPlansByDate.get(selectedDate);

  const shiftMonth = (delta: number) => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1),
    );
  };

  const shiftSelectedDate = (delta: number) => {
    setSelectedDate((prev) => {
      const next = addDaysToDateStr(prev, delta);
      const [year, month] = next.split("-").map(Number);
      setCurrentMonth(new Date(year, month - 1, 1));
      return next;
    });
  };

  const handlePrevious = () => {
    if (viewType === "month") {
      shiftMonth(-1);
      return;
    }
    if (viewType === "week") {
      shiftSelectedDate(-7);
      return;
    }
    shiftSelectedDate(-1);
  };

  const handleNext = () => {
    if (viewType === "month") {
      shiftMonth(1);
      return;
    }
    if (viewType === "week") {
      shiftSelectedDate(7);
      return;
    }
    shiftSelectedDate(1);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    const [year, month] = date.split("-").map(Number);
    setCurrentMonth(new Date(year, month - 1, 1));
    // ponytail: desktop keeps side panel; phone opens day sheet
    if (
      typeof window !== "undefined" &&
      !window.matchMedia("(min-width: 1024px)").matches
    ) {
      setIsMobileDayOpen(true);
    }
  };

  const openAddEventModal = () => {
    const defaults = resetEventFormDefaults();
    setEditingEventId(null);
    setEventDate(selectedDate);
    setTitle(defaults.title);
    setStartTime(defaults.startTime);
    setEndTime(defaults.endTime);
    setType(defaults.type);
    setLocation(defaults.location);
    setDescription(defaults.description);
    setCreatedBy(undefined);
    setForAllTeams(defaults.forAllTeams);
    createEventMutation.reset();
    updateEventMutation.reset();
    deleteEventMutation.reset();
    setIsModalOpen(true);
  };

  const openEditEventModal = (event: CalendarEvent) => {
    // ponytail: RobotEvents rows are read-only — open external page
    if (isRobotEventsId(event.id)) {
      if (event.href) {
        window.open(event.href, "_blank", "noopener,noreferrer");
      }
      return;
    }

    setEditingEventId(event.id);
    setTitle(event.title);
    setEventDate(event.date);
    setStartTime(event.startTime);
    setEndTime(event.endTime);
    setType(event.type);
    setLocation(event.location || DEFAULT_LOCATION);
    setDescription(event.description ?? "");
    setCreatedBy(event.createdBy);
    setForAllTeams(false);
    createEventMutation.reset();
    updateEventMutation.reset();
    deleteEventMutation.reset();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isModalBusy) return;
    createEventMutation.reset();
    updateEventMutation.reset();
    deleteEventMutation.reset();
    closeModal();
  };

  const handleSubmitEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !team?.id || isModalBusy) return;

    if (isEditMode && editingEventId) {
      updateEventMutation.mutate({
        eventId: editingEventId,
        title: title.trim(),
        date: eventDate,
        startTime,
        endTime,
        type,
        location,
        description: description.trim() || undefined,
      });
      return;
    }

    createEventMutation.mutate(
      {
        title: title.trim(),
        date: eventDate,
        startTime,
        endTime,
        type,
        location,
        description: description.trim() || undefined,
        forAllTeams: canMakeGlobal && forAllTeams ? true : undefined,
      },
      {
        onSuccess: () => {
          onActivityLog?.(
            `Event scheduled`,
            `${title.trim()} set on ${eventDate}`,
            "schedule",
          );
        },
      },
    );
  };

  const handleDeleteEvent = () => {
    if (!editingEventId || isModalBusy) return;
    setIsDeleteConfirmOpen(true);
  };

  const modalError = (() => {
    const mutation = isEditMode
      ? updateEventMutation.isError
        ? updateEventMutation
        : deleteEventMutation.isError
          ? deleteEventMutation
          : null
      : createEventMutation.isError
        ? createEventMutation
        : null;

    if (!mutation) return undefined;
    return mutation.error instanceof Error
      ? mutation.error.message
      : isEditMode
        ? "Failed to save event."
        : "Failed to create event.";
  })();

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden bg-slate-50 font-sans dark:bg-[#000000]">
      <div
        className={`flex h-full min-h-0 flex-1 flex-col border-r border-slate-200 px-4 py-6 sm:px-8 dark:border-[#1a1a1a] ${
          viewType === "month" ? "overflow-y-auto dashboard-scroll" : "overflow-hidden"
        }`}
      >
        <CalendarHeader viewType={viewType} onViewTypeChange={setViewType} />
        <CalendarMonthToolbar
          label={toolbarLabel}
          viewType={viewType}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onAddEvent={openAddEventModal}
        />

        {!isInitialLoading && sourcesStatus !== "both-unavailable" ? (
          <CalendarSourcesBanner
            status={sourcesStatus}
            warning={sourcesWarning}
            className="mb-3"
          />
        ) : null}

        {sourcesStatus === "both-unavailable" && !isInitialLoading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <CalendarSourcesBanner
              status={sourcesStatus}
              warning={sourcesWarning}
              className="max-w-md"
            />
          </div>
        ) : (
          <div
            className={`${viewType !== "month" ? "flex min-h-0 flex-1 flex-col" : ""} ${
              isInitialLoading ? "animate-pulse opacity-70" : ""
            }`}
          >
            {viewType === "month" ? (
              <CalendarMonthGrid
                calendarDays={calendarDays}
                eventsByDate={eventsByDate}
                dayPlansByDate={dayPlansByDate}
                selectedDate={selectedDate}
                todayStr={todayStr}
                onSelectDate={handleSelectDate}
                onEventClick={openEditEventModal}
              />
            ) : viewType === "week" ? (
              <CalendarScheduleGrid
                mode="week"
                days={weekDays}
                eventsByDate={eventsByDate}
                dayPlansByDate={dayPlansByDate}
                selectedDate={selectedDate}
                todayStr={todayStr}
                onSelectDate={handleSelectDate}
                onEventClick={openEditEventModal}
              />
            ) : (
              <CalendarScheduleGrid
                mode="day"
                days={dayCell}
                eventsByDate={eventsByDate}
                dayPlansByDate={dayPlansByDate}
                selectedDate={selectedDate}
                todayStr={todayStr}
                onSelectDate={handleSelectDate}
                onEventClick={openEditEventModal}
              />
            )}
          </div>
        )}
      </div>

      <div className="hidden h-full shrink-0 lg:flex">
        <CalendarSidePanel
          selectedDate={selectedDate}
          selectedDayPlan={selectedDayPlan}
          selectedDayEvents={selectedDayEvents}
          isDayPlanPending={isDayPlanPending}
          onSetDayPlan={(type: DayPlanType) => setDayPlan(selectedDate, type)}
          onClearDayPlan={() => clearDayPlan(selectedDate)}
          onAddEvent={openAddEventModal}
          onEventClick={openEditEventModal}
        />
      </div>

      {isMobileDayOpen ? (
        <>
          <button
            type="button"
            aria-label="Close day schedule overlay"
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
            onClick={() => setIsMobileDayOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[75dvh] overflow-hidden rounded-t-2xl border border-slate-200 shadow-2xl lg:hidden dark:border-[#1a1a1a]">
            <CalendarSidePanel
              selectedDate={selectedDate}
              selectedDayPlan={selectedDayPlan}
              selectedDayEvents={selectedDayEvents}
              isDayPlanPending={isDayPlanPending}
              onSetDayPlan={(type: DayPlanType) => setDayPlan(selectedDate, type)}
              onClearDayPlan={() => clearDayPlan(selectedDate)}
              onAddEvent={() => {
                setIsMobileDayOpen(false);
                openAddEventModal();
              }}
              onEventClick={(event) => {
                setIsMobileDayOpen(false);
                openEditEventModal(event);
              }}
              onClose={() => setIsMobileDayOpen(false)}
              className="max-h-[75dvh] border-l-0"
            />
          </div>
        </>
      ) : null}

      <CalendarEventModal
        isOpen={isModalOpen}
        mode={isEditMode ? "edit" : "create"}
        title={title}
        eventDate={eventDate}
        startTime={startTime}
        endTime={endTime}
        type={type}
        location={location}
        description={description}
        createdBy={createdBy}
        forAllTeams={forAllTeams}
        canMakeGlobal={canMakeGlobal}
        lockDate={!isEditMode}
        onTitleChange={setTitle}
        onDateChange={setEventDate}
        onStartTimeChange={setStartTime}
        onEndTimeChange={setEndTime}
        onTypeChange={setType}
        onLocationChange={setLocation}
        onDescriptionChange={setDescription}
        onForAllTeamsChange={setForAllTeams}
        onClose={handleCloseModal}
        onSubmit={handleSubmitEvent}
        onDelete={isEditMode ? handleDeleteEvent : undefined}
        isSubmitting={
          createEventMutation.isPending || updateEventMutation.isPending
        }
        isDeleting={deleteEventMutation.isPending}
        error={modalError}
      />

      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete this event?"
        description="This removes the event from the team calendar."
        confirmLabel="Delete"
        variant="danger"
        pending={deleteEventMutation.isPending}
        pendingLabel="Deleting..."
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          if (!editingEventId) return;
          deleteEventMutation.mutate(editingEventId, {
            onSettled: () => setIsDeleteConfirmOpen(false),
          });
        }}
      />
    </div>
  );
}
