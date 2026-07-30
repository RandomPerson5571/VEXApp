"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark";
export type AccentTheme = "orange" | "monochrome" | "custom";

const DEFAULT_CUSTOM_ACCENT = "#b65f2a";
const DEFAULT_FONT_SIZE = 100;
const MIN_FONT_SIZE = 90;
const MAX_FONT_SIZE = 115;

interface ThemeContextType {
  theme: Theme;
  accentTheme: AccentTheme;
  customAccentColor: string;
  fontSize: number;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setAccentTheme: (theme: AccentTheme) => void;
  setCustomAccentColor: (color: string) => void;
  setFontSize: (fontSize: number) => void;
  resetInterface: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "theme";
const ACCENT_THEME_KEY = "accent-theme";
const CUSTOM_ACCENT_KEY = "custom-accent-color";
const FONT_SIZE_KEY = "font-size";
const listeners = new Set<() => void>();
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function emitThemeChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

function readStoredAccentTheme(): AccentTheme {
  const stored = localStorage.getItem(ACCENT_THEME_KEY);
  if (stored === "orange" || stored === "monochrome" || stored === "custom") {
    return stored;
  }
  return "orange";
}

function readStoredCustomAccentColor(): string {
  const stored = localStorage.getItem(CUSTOM_ACCENT_KEY);
  if (stored && HEX_COLOR_PATTERN.test(stored)) {
    return stored.toLowerCase();
  }
  return DEFAULT_CUSTOM_ACCENT;
}

function clampFontSize(fontSize: number) {
  if (!Number.isFinite(fontSize)) return DEFAULT_FONT_SIZE;
  return Math.min(Math.max(Math.round(fontSize), MIN_FONT_SIZE), MAX_FONT_SIZE);
}

function readStoredFontSize(): number {
  return clampFontSize(Number(localStorage.getItem(FONT_SIZE_KEY)));
}

function getServerSnapshot(): Theme {
  return "dark";
}

function getAccentServerSnapshot(): AccentTheme {
  return "orange";
}

function getCustomAccentServerSnapshot(): string {
  return DEFAULT_CUSTOM_ACCENT;
}

function getFontSizeServerSnapshot(): number {
  return DEFAULT_FONT_SIZE;
}

function hexToRgb(color: string) {
  return {
    red: Number.parseInt(color.slice(1, 3), 16),
    green: Number.parseInt(color.slice(3, 5), 16),
    blue: Number.parseInt(color.slice(5, 7), 16),
  };
}

function applyAccentToDOM(
  accentTheme: AccentTheme,
  customAccentColor: string,
) {
  const htmlElement = document.documentElement;
  const accentColor =
    accentTheme === "monochrome"
      ? "#a1a1aa"
      : accentTheme === "custom"
        ? customAccentColor
        : "#ea580c";
  const rgb = hexToRgb(accentColor);

  htmlElement.dataset.siteTheme = accentTheme;
  htmlElement.style.setProperty("--site-accent", accentColor);
  htmlElement.style.setProperty(
    "--site-accent-rgb",
    `${rgb.red} ${rgb.green} ${rgb.blue}`,
  );
}

function applyFontSizeToDOM(fontSize: number) {
  document.documentElement.style.fontSize = `${clampFontSize(fontSize)}%`;
}

function applyThemeToDOM(theme: Theme) {
  const htmlElement = document.documentElement;
  if (theme === "dark") {
    htmlElement.classList.add("dark");
  } else {
    htmlElement.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readStoredTheme, getServerSnapshot);
  const accentTheme = useSyncExternalStore(
    subscribe,
    readStoredAccentTheme,
    getAccentServerSnapshot,
  );
  const customAccentColor = useSyncExternalStore(
    subscribe,
    readStoredCustomAccentColor,
    getCustomAccentServerSnapshot,
  );
  const fontSize = useSyncExternalStore(
    subscribe,
    readStoredFontSize,
    getFontSizeServerSnapshot,
  );

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  useEffect(() => {
    applyAccentToDOM(accentTheme, customAccentColor);
  }, [accentTheme, customAccentColor]);

  useEffect(() => {
    applyFontSizeToDOM(fontSize);
  }, [fontSize]);

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(THEME_KEY, next);
    applyThemeToDOM(next);
    emitThemeChange();
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = readStoredTheme() === "dark" ? "light" : "dark";
    setTheme(next);
  }, [setTheme]);

  const setAccentTheme = useCallback((next: AccentTheme) => {
    localStorage.setItem(ACCENT_THEME_KEY, next);
    applyAccentToDOM(next, readStoredCustomAccentColor());
    emitThemeChange();
  }, []);

  const setCustomAccentColor = useCallback((next: string) => {
    const color = HEX_COLOR_PATTERN.test(next) ? next.toLowerCase() : DEFAULT_CUSTOM_ACCENT;
    localStorage.setItem(CUSTOM_ACCENT_KEY, color);
    localStorage.setItem(ACCENT_THEME_KEY, "custom");
    applyAccentToDOM("custom", color);
    emitThemeChange();
  }, []);

  const setFontSize = useCallback((next: number) => {
    const normalized = clampFontSize(next);
    localStorage.setItem(FONT_SIZE_KEY, String(normalized));
    applyFontSizeToDOM(normalized);
    emitThemeChange();
  }, []);

  const resetInterface = useCallback(() => {
    localStorage.setItem(ACCENT_THEME_KEY, "orange");
    localStorage.setItem(CUSTOM_ACCENT_KEY, DEFAULT_CUSTOM_ACCENT);
    localStorage.setItem(FONT_SIZE_KEY, String(DEFAULT_FONT_SIZE));
    applyAccentToDOM("orange", DEFAULT_CUSTOM_ACCENT);
    applyFontSizeToDOM(DEFAULT_FONT_SIZE);
    emitThemeChange();
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        accentTheme,
        customAccentColor,
        fontSize,
        toggleTheme,
        setTheme,
        setAccentTheme,
        setCustomAccentColor,
        setFontSize,
        resetInterface,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "dark" as const,
      accentTheme: "orange" as const,
      customAccentColor: DEFAULT_CUSTOM_ACCENT,
      fontSize: DEFAULT_FONT_SIZE,
      toggleTheme: () => {},
      setTheme: () => {},
      setAccentTheme: () => {},
      setCustomAccentColor: () => {},
      setFontSize: () => {},
      resetInterface: () => {},
    };
  }
  return context;
}
