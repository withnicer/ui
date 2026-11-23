// @vitest-environment jsdom
import { act } from "react";
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

import Switch from "../../src/components/Switch";

let container: HTMLDivElement;
let root: Root;

const render = async (element: React.ReactElement) => {
  await act(async () => {
    root.render(element);
  });
};

const theSwitch = () =>
  container.querySelector<HTMLButtonElement>("[role='switch']");

describe("Switch", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("is a switch to assistive technology, named by its label and saying whether it is on", async () => {
    await render(
      <Switch aria-label="Agency site is live" defaultChecked size="l" />
    );

    const element = theSwitch();
    expect(element?.tagName).toBe("BUTTON");
    expect(element?.getAttribute("aria-label")).toBe("Agency site is live");
    expect(element?.getAttribute("aria-checked")).toBe("true");
  });

  it("flips its state on a click and reports the new one", async () => {
    const onChange = vi.fn();
    await render(<Switch onChange={onChange} size="s" />);
    expect(theSwitch()?.getAttribute("aria-checked")).toBe("false");

    await act(async () => {
      theSwitch()?.click();
    });

    expect(theSwitch()?.getAttribute("aria-checked")).toBe("true");
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("follows a new default the page passes, as when a save comes back", async () => {
    await render(<Switch defaultChecked={false} size="l" />);

    await render(<Switch defaultChecked size="l" />);

    expect(theSwitch()?.getAttribute("aria-checked")).toBe("true");
  });
});
