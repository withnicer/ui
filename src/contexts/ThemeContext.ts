import { createContext } from "react";

export type ThemeName = "dark" | "light";

/**
 * Shows `theme` and saves it as the visitor's choice. With `persist: false`
 * it is shown and not saved: a look one page asks for (an agency's own mode)
 * must not become the choice the next page starts from.
 */
export type SetTheme = (
  theme: ThemeName,
  options?: { persist?: boolean }
) => void;

export type ThemeContextValue = [ThemeName, SetTheme];

/** `[theme, setTheme]`, provided by `ThemeProvider`. */
export const ThemeContext = createContext<ThemeContextValue>([
  "light",
  () => null,
]);

export default ThemeContext;
