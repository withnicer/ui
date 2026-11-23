// @vitest-environment jsdom
import { act, useContext, useEffect } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";

import ThemeProvider, { savedTheme } from "../../src/components/ThemeProvider";
import ThemeContext from "../../src/contexts/ThemeContext";
import type { ThemeContextValue } from "../../src/contexts/ThemeContext";

let container: HTMLDivElement;
let root: Root;
/** The context value the last render handed out. */
const seen: { current?: ThemeContextValue } = {};

function Reader() {
  const value = useContext(ThemeContext);
  useEffect(() => {
    seen.current = value;
  });
  return null;
}

const mount = async () => {
  await act(async () => {
    root.render(
      <ThemeProvider>
        <Reader />
      </ThemeProvider>
    );
  });
};

const pick = async (...args: Parameters<ThemeContextValue[1]>) => {
  await act(async () => {
    seen.current?.[1](...args);
  });
};

const bodyTheme = () =>
  document.body.classList.contains("dark") ? "dark" : "light";

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.className = "";
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("starts from the theme the visitor saved, and saves the one they pick", async () => {
    localStorage.setItem("theme", "dark");
    await mount();
    expect(seen.current?.[0]).toBe("dark");
    expect(bodyTheme()).toBe("dark");

    await pick("light");

    expect(bodyTheme()).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("shows a theme a page asks for without saving it, then saves the visitor's next pick", async () => {
    localStorage.setItem("theme", "light");
    await mount();

    await pick("dark", { persist: false });

    expect(seen.current?.[0]).toBe("dark");
    expect(bodyTheme()).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("light");

    await pick("light");
    await pick("dark");

    expect(localStorage.getItem("theme")).toBe("dark");
  });
});

describe("savedTheme", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is the visitor's choice, else the device's when the app follows it, else light", () => {
    vi.stubGlobal("matchMedia", (media: string) => ({
      matches: media === "(prefers-color-scheme: dark)",
    }));

    expect(savedTheme()).toBe("light");
    expect(savedTheme(true)).toBe("dark");

    localStorage.setItem("theme", "light");

    expect(savedTheme(true)).toBe("light");
  });
});
