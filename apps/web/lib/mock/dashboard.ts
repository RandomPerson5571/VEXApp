import type {
  Activity,
  BuildStatusComponent,
  CalendarEvent,
  DesignNotebookEntry,
  MatchRecord,
  UpcomingMatch,
} from "@/lib/types/team";

export const mockBuildComponents: BuildStatusComponent[] = [
  { id: "bc1", name: "Drivetrain", percentage: 100, colorClass: "bg-green-500" },
  { id: "bc2", name: "Intake System", percentage: 100, colorClass: "bg-green-500" },
  { id: "bc3", name: "Lift Mechanism", percentage: 80, colorClass: "bg-blue-500" },
  { id: "bc4", name: "Shooting System", percentage: 60, colorClass: "bg-blue-500" },
  { id: "bc5", name: "Claw / End Effector", percentage: 40, colorClass: "bg-yellow-500" },
  { id: "bc6", name: "Programming", percentage: 75, colorClass: "bg-blue-500" },
];

export const mockActivities: Activity[] = [
  {
    id: "a1",
    text: "Match 24 was scouted",
    subtext: "Red Alliance vs Blue Alliance",
    time: "2m ago",
    type: "scout",
  },
  {
    id: "a2",
    text: "Design doc updated",
    subtext: "v5_Arm_Assembly.pdf",
    time: "1h ago",
    type: "doc",
  },
  {
    id: "a3",
    text: "Inventory item used",
    subtext: "V5 Motor (Smart) x1",
    time: "2h ago",
    type: "inventory",
  },
  {
    id: "a4",
    text: "Build log entry added",
    subtext: "Lift testing and adjustments",
    time: "3h ago",
    type: "build",
  },
  {
    id: "a5",
    text: "Practice match scheduled",
    subtext: "Tomorrow at 4:30 PM",
    time: "5h ago",
    type: "schedule",
  },
];

export const mockMatches: MatchRecord[] = [
  {
    id: "mr1",
    matchName: "M18",
    alliance: "Blue",
    opponent: "CyberKnights 99A",
    autonomousScore: 12,
    driverScore: 36,
    highScore: 48,
    autoWin: false,
    driverWin: true,
    scoutedBy: "Jack D.",
  },
  {
    id: "mr2",
    matchName: "M19",
    alliance: "Red",
    opponent: "RoboGladiators 33X",
    autonomousScore: 18,
    driverScore: 54,
    highScore: 72,
    autoWin: true,
    driverWin: true,
    scoutedBy: "Jack D.",
  },
  {
    id: "mr3",
    matchName: "M20",
    alliance: "Blue",
    opponent: "Hyperion 10D",
    autonomousScore: 15,
    driverScore: 40,
    highScore: 55,
    autoWin: true,
    driverWin: false,
    scoutedBy: "Jack D.",
  },
  {
    id: "mr4",
    matchName: "M21",
    alliance: "Red",
    opponent: "Blaze 4531S",
    autonomousScore: 25,
    driverScore: 60,
    highScore: 85,
    autoWin: true,
    driverWin: true,
    scoutedBy: "Alex Chen",
  },
  {
    id: "mr5",
    matchName: "M22",
    alliance: "Blue",
    opponent: "Overdrive 1200Z",
    autonomousScore: 18,
    driverScore: 50,
    highScore: 68,
    autoWin: false,
    driverWin: true,
    scoutedBy: "Alex Chen",
  },
  {
    id: "mr6",
    matchName: "M23",
    alliance: "Red",
    opponent: "Apex 8000F",
    autonomousScore: 5,
    driverScore: 30,
    highScore: 35,
    autoWin: false,
    driverWin: false,
    scoutedBy: "David Kim",
  },
  {
    id: "mr7",
    matchName: "M24",
    alliance: "Blue",
    opponent: "Titanium 55H",
    autonomousScore: 22,
    driverScore: 70,
    highScore: 92,
    autoWin: true,
    driverWin: true,
    scoutedBy: "Jackson D.",
  },
];

export const mockEvents: CalendarEvent[] = [
  { id: "e2", title: "VEX Scrimmage", date: "2025-05-03", startTime: "8:00 AM", endTime: "5:00 PM", type: "scrimmage" },
  { id: "e11", title: "Build Session", date: "2025-05-14", startTime: "4:30 PM", endTime: "6:30 PM", type: "build" },
  { id: "e12", title: "Practice Match", date: "2025-05-14", startTime: "7:00 PM", endTime: "8:30 PM", type: "practice_match" },
  { id: "e15", title: "VEX Scrimmage", date: "2025-05-17", startTime: "8:00 AM", endTime: "5:00 PM", type: "scrimmage", matchesCount: 5 },
  { id: "e21", title: "Regional Championship", date: "2025-05-24", startTime: "7:30 AM", endTime: "6:00 PM", type: "championship", matchesCount: 10 },
];

export const mockUpcomingMatches: UpcomingMatch[] = [
  {
    id: "um1",
    monthLabel: "May",
    day: 17,
    title: "VEX Scrimmage",
    location: "Coppell High School",
    time: "08:00 AM • 5 matches",
    accentClass: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  {
    id: "um2",
    monthLabel: "May",
    day: 24,
    title: "Regional Championship",
    location: "Convention Arena",
    time: "07:30 AM • 10 matches",
    accentClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
];

export const mockRobotLabel = "604A";

export const mockWeek2DesignEntry: DesignNotebookEntry = {
  id: "d1",
  title: "Week 2: Intake Redesign - Design Notebook entry",
  week: "Week 2",
  category: "Season 2024-2025",
  introduction:
    "Week 2 focus was initiating redesigns on our roller intake mechanism. Initial tests with standard flaps exhibited excessive slippage on high-altitude ring pick-ups, limiting our ability to deploy rapidly onto the high goals.",
  designConstraints: [
    "Width must not exceed 240mm to guarantee proper interior shaft clearance.",
    "Intake must be driven by a single 11W V5 Smart Motor geared for high velocity speed ratios.",
    "Mechanism must swing 90-degrees actively or passively to comply with VEX expansion rules during matching.",
  ],
  conceptSketchesDescription:
    "To reduce friction and slip during high-altitude ring picking, we designed a dual-roller configuration using high-traction silicone roller flaps, reinforced by a secondary spring-loaded passive alignment channel.",
  prototypesText:
    "Prototype A utilized linear sprocket gears, which proved too heavy. Prototype B, the dual-chain configuration shown in our schematic drawing, utilizes direct torque transmission through custom CNC sprocket brackets and lightweight aluminum spacers.",
  testingResults:
    "High speed roller testing achieved a stable 92% successful intake rating across M18-M24 matches, maintaining high acceleration during tight turns and enabling efficient load stacking.",
  conclusion:
    "The chain-driven intake structure is structurally sound, stable, and delivers dependable torque to both rollers simultaneously without slipping.",
  nextSteps:
    "Next week we will refine the Lift Mechanism bracket attachments to align precisely with the intake exit channel.",
};
