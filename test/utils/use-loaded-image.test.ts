// @vitest-environment jsdom
import { act, createElement, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useLoadedImage } from "../../src/utils/use-loaded-image";

/** The probes the hook created, to answer as the browser would (jsdom loads none). */
const probes: FakeImage[] = [];
class FakeImage {
  naturalHeight = 0;
  naturalWidth = 0;
  onerror: (() => void) | null = null;
  onload: (() => void) | null = null;
  src = "";
  constructor() {
    probes.push(this);
  }
}

let shown: string | undefined;
const report = (value: string | undefined) => {
  shown = value;
};
const Probe = ({ onBroken, src }: { onBroken: () => void; src?: string }) => {
  const value = useLoadedImage(src, onBroken);
  useEffect(() => report(value), [value]);
  return null;
};

const render = (src: string, onBroken: () => void) => {
  const root = createRoot(document.createElement("div"));
  act(() => root.render(createElement(Probe, { onBroken, src })));
  return root;
};

beforeEach(() => {
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("Image", FakeImage);
  probes.length = 0;
  shown = undefined;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useLoadedImage", () => {
  it("answers the photo once it loaded, and nothing before", () => {
    const onBroken = vi.fn();
    render("https://img.example/hero.jpg", onBroken);
    expect(shown).toBeUndefined();

    const [probe] = probes;
    act(() => {
      Object.assign(probe ?? {}, { naturalHeight: 800, naturalWidth: 1200 });
      probe?.onload?.();
    });

    expect(shown).toBe("https://img.example/hero.jpg");
    expect(onBroken).not.toHaveBeenCalled();
  });

  it("reports a photo that failed or came back as the proxy's pixel", () => {
    const onBroken = vi.fn();
    render("https://media.example/place-photo/expired", onBroken);
    act(() => {
      Object.assign(probes[0] ?? {}, { naturalHeight: 1, naturalWidth: 1 });
      probes[0]?.onload?.();
    });
    render("https://media.example/missing.jpg", onBroken);
    act(() => probes[1]?.onerror?.());

    expect(onBroken).toHaveBeenCalledTimes(2);
    expect(shown).toBeUndefined();
  });
});
