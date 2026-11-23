// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { haptic } from "../../src/utils/haptics";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
// iPadOS and desktop Safari send the same Mac user agent.
const MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15";

// The switches the iOS path toggled, read off the change events they fire.
const toggled: HTMLInputElement[] = [];
const recordToggle = (event: Event) => {
  if (event.target instanceof HTMLInputElement) {
    toggled.push(event.target);
  }
};

beforeEach(() => {
  toggled.length = 0;
  document.addEventListener("change", recordToggle);
});

afterEach(() => {
  document.removeEventListener("change", recordToggle);
  vi.unstubAllGlobals();
});

describe("haptic", () => {
  it("vibrates where the Vibration API exists, in a tap or not", () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal("navigator", {
      maxTouchPoints: 5,
      userAgent: "Android",
      vibrate,
    });

    haptic();
    haptic("success", { inGesture: false });

    expect(vibrate.mock.calls).toEqual([[10], [[14, 60, 22]]]);
    expect(toggled).toHaveLength(0);
  });

  it.each([
    ["an iPhone", IPHONE],
    ["an iPad", MAC],
  ])(
    "toggles one hidden switch on %s and leaves nothing behind",
    (_, userAgent) => {
      vi.stubGlobal("navigator", { maxTouchPoints: 5, userAgent });
      const children = document.head.childElementCount;

      haptic("success");

      expect(toggled).toHaveLength(1);
      expect(toggled[0]?.type).toBe("checkbox");
      expect(toggled[0]?.hasAttribute("switch")).toBe(true);
      expect(document.head.childElementCount).toBe(children);
    }
  );

  it("toggles nothing on a desktop Mac, nor on iOS outside a tap", () => {
    vi.stubGlobal("navigator", { maxTouchPoints: 0, userAgent: MAC });
    haptic();

    vi.stubGlobal("navigator", { maxTouchPoints: 5, userAgent: IPHONE });
    haptic("success", { inGesture: false });

    expect(toggled).toHaveLength(0);
  });

  it("never throws, whatever the browser lacks or refuses", () => {
    vi.stubGlobal("navigator", {
      vibrate: () => {
        throw new Error("Blocked");
      },
    });
    expect(() => {
      haptic();
    }).not.toThrow();

    vi.stubGlobal("navigator", undefined);
    expect(() => {
      haptic("success");
    }).not.toThrow();
  });
});
