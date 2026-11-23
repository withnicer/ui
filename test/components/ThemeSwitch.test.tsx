// @vitest-environment jsdom
import { expect, it, vi } from "vite-plus/test";

import ThemeSwitch from "../../src/components/ThemeSwitch";
import ThemeContext from "../../src/contexts/ThemeContext";
import type { ThemeName } from "../../src/contexts/ThemeContext";
import { click, getByRole, render } from "../support/render";

it.each([
  ["light", "dark"],
  ["dark", "light"],
] as const)("switches the %s theme to %s", (shown: ThemeName, next) => {
  const setTheme = vi.fn();
  render(
    <ThemeContext.Provider value={[shown, setTheme]}>
      <ThemeSwitch />
    </ThemeContext.Provider>
  );

  click(getByRole("button", "Switch theme"));

  expect(setTheme).toHaveBeenCalledExactlyOnceWith(next);
});
