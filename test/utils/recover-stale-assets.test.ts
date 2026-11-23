// @vitest-environment jsdom
import {
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
  vi,
} from "vite-plus/test";

import { recoverStaleAssets } from "../../src/utils/recover-stale-assets";

const RELOADED_AT = "nicer:asset-reload-at";
const NOW = new Date("2026-10-21T15:00:00Z").getTime();

/** Reloads the page started: jsdom cannot navigate and reports each one. */
let reloads = 0;

beforeAll(() => {
  // The JSDOM instance vitest exposes as a global.
  const { jsdom } = globalThis as typeof globalThis & {
    jsdom: {
      virtualConsole: {
        on: (event: "jsdomError", listener: (error: Error) => void) => void;
      };
    };
  };
  jsdom.virtualConsole.on("jsdomError", (error) => {
    if (error.message.includes("navigation")) {
      reloads += 1;
    }
  });
  // Once, as the app's entry point does.
  recoverStaleAssets();
});

beforeEach(() => {
  reloads = 0;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** Vite's event for a lazy chunk that failed to load; true if it was handled. */
const chunkFails = () => {
  const event = new Event("vite:preloadError", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};

it("reloads the tab when a lazy chunk from an older release is gone", () => {
  expect(chunkFails()).toBe(true);
  expect(reloads).toBe(1);
  expect(sessionStorage.getItem(RELOADED_AT)).toBe(String(NOW));
});

it("lets the error through when the tab reloaded less than a minute ago", () => {
  sessionStorage.setItem(RELOADED_AT, String(NOW - 59_000));

  expect(chunkFails()).toBe(false);
  expect(reloads).toBe(0);
});

it("reloads again once a minute has passed", () => {
  sessionStorage.setItem(RELOADED_AT, String(NOW - 61_000));

  expect(chunkFails()).toBe(true);
  expect(reloads).toBe(1);
});

it("lets the error through when the tab cannot remember reloading", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  });

  expect(chunkFails()).toBe(false);
  expect(reloads).toBe(0);
});
