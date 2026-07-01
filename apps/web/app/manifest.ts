import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "STL VEX Robotics",
    short_name: "STL VEX",
    description:
      "Team hub for STL VEX Robotics. Manage matches, build logs, inventory, calendar, documents, and members.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#ea580c",
    orientation: "portrait-primary",
    categories: ["education", "productivity", "sports"],
    icons: [
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logos/Robotics_lion.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        url: "/dashboard",
      },
      {
        name: "Task List",
        short_name: "Tasks",
        url: "/task-list",
      },
      {
        name: "Inventory",
        short_name: "Inventory",
        url: "/inventory",
      },
    ],
  };
}
