// @vitest-environment jsdom
import { act } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";

import Tooltip from "../../src/components/Tooltip";
import {
  getByText,
  hover,
  queryByRole,
  render,
  unhover,
} from "../support/render";

// jsdom lays nothing out: the anchor and the bubble get the boxes a test
// gives them, on a 1000 x 800 screen.
let anchorBox: DOMRect;
const BUBBLE = new DOMRect(0, 0, 200, 40);

beforeEach(() => {
  anchorBox = new DOMRect(100, 100, 80, 20);
  vi.stubGlobal("innerWidth", 1000);
  vi.stubGlobal("innerHeight", 800);
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function boundingRect(this: Element) {
      return this.getAttribute("role") === "tooltip" ? BUBBLE : anchorBox;
    }
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const bubble = () => queryByRole("tooltip");

/** Where the bubble was placed, as `left,top`. */
const placed = () => {
  const { left, top } = bubble()?.style ?? {};
  return `${left},${top}`;
};

const anchor = () => getByText("Commission").parentElement as HTMLElement;

it("shows its label while the pointer is over the anchor", () => {
  render(
    <Tooltip label="Paid when the trip ends">
      <span>Commission</span>
    </Tooltip>
  );
  expect(bubble()).toBeNull();

  hover(anchor());
  expect(bubble()?.textContent).toBe("Paid when the trip ends");

  unhover(anchor());
  expect(bubble()).toBeNull();
});

it("shows nothing while it is disabled", () => {
  render(
    <Tooltip disabled label="Paid when the trip ends">
      <span>Commission</span>
    </Tooltip>
  );

  hover(anchor());

  expect(bubble()).toBeNull();
});

it.each([
  [
    "below the anchor, left edges aligned",
    new DOMRect(100, 100, 80, 20),
    "100px,128px",
  ],
  [
    "right-aligned when it would run off the right",
    new DOMRect(880, 100, 80, 20),
    "760px,128px",
  ],
  [
    "16 px inside the right edge for an anchor that touches it",
    new DOMRect(950, 100, 50, 20),
    "784px,128px",
  ],
  [
    "16 px inside the left edge for an anchor that starts past it",
    new DOMRect(4, 100, 80, 20),
    "16px,128px",
  ],
  [
    "above the anchor when there is no room below",
    new DOMRect(100, 760, 80, 20),
    "100px,712px",
  ],
  [
    "below a tall anchor even without room, when there is none above either",
    new DOMRect(100, 30, 80, 760),
    "100px,798px",
  ],
])("opens %s", (_case, box, position) => {
  anchorBox = box;
  render(
    <Tooltip label="Paid when the trip ends">
      <span>Commission</span>
    </Tooltip>
  );

  hover(anchor());

  expect(placed()).toBe(position);
});

it("follows the anchor when the page scrolls", () => {
  render(
    <Tooltip label="Paid when the trip ends">
      <span>Commission</span>
    </Tooltip>
  );
  hover(anchor());

  anchorBox = new DOMRect(100, 300, 80, 20);
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });

  expect(placed()).toBe("100px,328px");
});
