"use client";

import { Check, Monitor, Palette, RotateCcw, Type } from "lucide-react";

import {
  type AccentTheme,
  useTheme,
} from "@/components/providers/ThemeProvider";

import { SettingsSection } from "./SettingsSection";

const accentOptions: {
  id: AccentTheme;
  label: string;
  description: string;
  swatch: string;
}[] = [
  {
    id: "orange",
    label: "Orange",
    description: "The default VEX Hub look.",
    swatch: "#ea580c",
  },
  {
    id: "monochrome",
    label: "Monochrome",
    description: "Neutral controls and accents.",
    swatch: "#a1a1aa",
  },
  {
    id: "custom",
    label: "Custom",
    description: "Use your own accent color.",
    swatch: "var(--site-accent)",
  },
];

const fontSizeMarks = [
  { value: 90, label: "Small" },
  { value: 100, label: "Default" },
  { value: 115, label: "Large" },
];

export function InterfaceSettingsView() {
  const {
    accentTheme,
    customAccentColor,
    fontSize,
    setAccentTheme,
    setCustomAccentColor,
    setFontSize,
    resetInterface,
  } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-100">
          Interface
        </h1>
        <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
          Adjust the site accent color and text scale for this device.
        </p>
      </div>

      <SettingsSection
        title="Site Theme"
        description="Choose the accent style used across navigation, buttons, and highlights."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {accentOptions.map((option) => {
            const isActive = accentTheme === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setAccentTheme(option.id)}
                className={`group flex min-h-28 flex-col items-start justify-between rounded-xl border p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out motion-safe:active:scale-[0.98] motion-reduce:transition-none ${
                  isActive
                    ? "border-orange-500/30 bg-orange-500/10 shadow-lg shadow-orange-500/10"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white dark:border-[#1a1a1a] dark:bg-[#121212]/60 dark:hover:border-slate-800 dark:hover:bg-[#121212]"
                }`}
              >
                <span className="flex w-full items-center justify-between gap-3">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 shadow-inner"
                    style={{ backgroundColor: option.swatch }}
                    aria-hidden
                  >
                    {option.id === "custom" ? (
                      <Palette className="h-4 w-4 text-white drop-shadow" />
                    ) : null}
                  </span>
                  {isActive ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </span>
                <span>
                  <span className="block text-sm font-black text-slate-900 dark:text-slate-100">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-500">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1a1a1a] dark:bg-[#121212]/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              <Palette className="h-4.5 w-4.5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                Custom accent
              </p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                Picking a color switches the site theme to custom.
              </p>
            </div>
          </div>
          <input
            type="color"
            value={customAccentColor}
            onChange={(event) => setCustomAccentColor(event.target.value)}
            className="h-10 w-16 cursor-pointer rounded-lg border border-slate-300 bg-transparent p-0 dark:border-slate-700"
            aria-label="Custom site accent color"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Font Size"
        description="Scale interface text throughout the app."
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1a1a1a] dark:bg-[#121212]/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                <Type className="h-4.5 w-4.5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                  Text scale
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  Current size: {fontSize}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
              <Monitor className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                Aa
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min={90}
              max={115}
              step={1}
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
              className="w-full accent-orange-600"
              aria-label="Interface font size"
            />
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {fontSizeMarks.map((mark) => (
                <button
                  key={mark.value}
                  type="button"
                  onClick={() => setFontSize(mark.value)}
                  className="rounded-md px-2 py-1 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-[#121212] dark:hover:text-slate-200"
                >
                  {mark.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={resetInterface}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-[#1a1a1a] dark:text-slate-400 dark:hover:border-slate-800 dark:hover:bg-[#121212] dark:hover:text-slate-200"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Interface
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}
