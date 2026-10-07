import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    console.log("useEffect: applying theme", theme, "to root");
    if (theme === "dark") {
      root.classList.add("dark");
      console.log("Added 'dark' class to root");
    } else {
      root.classList.remove("dark");
      console.log("Removed 'dark' class from root");
    }

    if (switchable) {
      localStorage.setItem("theme", theme);
      console.log("Saved theme to localStorage:", theme);
    }
  }, [theme, switchable]);

  const toggleTheme = switchable
    ? () => {
        console.log("toggleTheme called, current theme:", theme);
        setTheme(prev => {
          const newTheme = prev === "light" ? "dark" : "light";
          console.log("Setting theme from", prev, "to", newTheme);
          return newTheme;
        });
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
