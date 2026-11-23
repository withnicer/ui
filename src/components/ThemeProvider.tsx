import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import ThemeContext, {
  type SetTheme,
  type ThemeContextValue,
  type ThemeName,
} from "../contexts/ThemeContext";

const STORAGE_KEY = "theme";

export interface ThemeProviderProps {
  /**
   * Apply the class and save the choice inside `setTheme`, before React
   * re-renders: consumers that read the computed tokens while rendering
   * (charts) must already get the new theme's values.
   */
  applyBeforeRender?: boolean;
  children: ReactNode;
  /** With no saved choice, follow the device (`prefers-color-scheme`). */
  followSystem?: boolean;
  /**
   * Repaint `<meta name="theme-color">` with the theme's `--bgPrimary`: the
   * browser paints the installed app's status-bar strip from it.
   */
  syncThemeColor?: boolean;
}

const applyThemeClass = (theme: ThemeName) => {
  document.body.classList.remove(theme === "dark" ? "light" : "dark");
  document.body.classList.add(theme);
};

const systemTheme = (): ThemeName =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

/**
 * The visitor's own theme: the one they chose, else the device's when the
 * app follows it, else light. What a page that showed another look goes back to.
 */
export const savedTheme = (followSystem = false): ThemeName => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") {
    return saved;
  }
  return followSystem ? systemTheme() : "light";
};

const syncMetaThemeColor = () => {
  const meta = document.querySelector('meta[name="theme-color"]');
  const background = getComputedStyle(document.body).getPropertyValue(
    "--bgPrimary"
  );
  if (meta && background) {
    meta.setAttribute("content", background.trim());
  }
};

/**
 * Owns the light/dark theme: the `light`/`dark` class on <body>, the choice
 * saved under `localStorage.theme`, and `ThemeContext`.
 */
export default function ThemeProvider({
  applyBeforeRender = false,
  children,
  followSystem = false,
  syncThemeColor = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>(() =>
    savedTheme(followSystem)
  );
  // Whether the theme on screen is the visitor's choice, to be saved.
  const persistRef = useRef(true);

  const setTheme = useCallback<SetTheme>(
    (next, options) => {
      persistRef.current = options?.persist ?? true;
      if (applyBeforeRender) {
        applyThemeClass(next);
        if (persistRef.current) {
          localStorage.setItem(STORAGE_KEY, next);
        }
      }
      setThemeState(next);
    },
    [applyBeforeRender]
  );

  useEffect(() => {
    applyThemeClass(theme);

    if (!applyBeforeRender && persistRef.current) {
      localStorage.setItem(STORAGE_KEY, theme);
    }

    if (syncThemeColor) {
      syncMetaThemeColor();
    }
  }, [applyBeforeRender, syncThemeColor, theme]);

  const value = useMemo<ThemeContextValue>(
    () => [theme, setTheme],
    [setTheme, theme]
  );

  // Render
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
