"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [isMounted, setIsMounted] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    
    // Get stored theme or system preference
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    let initialTheme: Theme = "dark";
    
    if (storedTheme) {
      initialTheme = storedTheme;
    } else if (typeof window !== "undefined" && window.matchMedia) {
      initialTheme = window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
    }
    
    setTheme(initialTheme);
    applyThemeToDOM(initialTheme);
  }, []);

  const applyThemeToDOM = useCallback((newTheme: Theme) => {
    const htmlElement = document.documentElement;
    
    if (newTheme === "dark") {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }
    
    htmlElement.style.colorScheme = newTheme;
    localStorage.setItem("theme", newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    applyThemeToDOM(newTheme);
  }, [theme, applyThemeToDOM]);

  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return { theme: "dark" as const, toggleTheme: () => {} };
  }
  return context;
}
