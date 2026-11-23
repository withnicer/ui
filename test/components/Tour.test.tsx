// @vitest-environment jsdom
import { act } from "react";
import {
  afterEach,
  beforeEach,
  expect,
  it,
  onTestFinished,
  vi,
} from "vite-plus/test";

import Tour from "../../src/components/Tour";
import type { TourStep } from "../../src/components/Tour";
import { click, getByText, queryAllByText, render } from "../support/render";

// jsdom lays nothing out: an element has a box only when a test gives it one.
const boxes = new WeakMap<Element, DOMRect>();

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("innerWidth", 1000);
  vi.stubGlobal("innerHeight", 1000);
  vi.spyOn(Element.prototype, "getClientRects").mockImplementation(
    function clientRects(this: Element) {
      const box = boxes.get(this);
      return (box ? [box] : []) as unknown as DOMRectList;
    }
  );
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function boundingRect(this: Element) {
      return boxes.get(this) ?? new DOMRect();
    }
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** An element a step points at, laid out at `box` unless it is `null`. */
function target(
  id: string,
  box: DOMRect | null = new DOMRect(100, 100, 200, 40)
) {
  const element = document.createElement("section");
  element.id = id;
  if (box) {
    boxes.set(element, box);
  }
  document.body.append(element);
  onTestFinished(() => element.remove());
  return element;
}

const step = (id: string, extra: Partial<TourStep> = {}): TourStep => ({
  content: `About ${id}`,
  target: `#${id}`,
  ...extra,
});

/** Lets the tour's polling, fades and frames run. */
const wait = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

/** "Step 2 of 3" and the step's text, or null while no tooltip is up. */
const shownStep = () => {
  const [counter] = queryAllByText(/^Step \d+ of \d+$/);
  const [text] = queryAllByText(/^About /);
  return counter ? `${counter.textContent} · ${text?.textContent}` : null;
};

function start(steps: TourStep[]) {
  const onClose = vi.fn();
  const setRun = vi.fn();
  const view = render(
    <Tour onClose={onClose} run setRun={setRun} steps={steps} />
  );
  return { ...view, onClose, setRun };
}

it("tours only the steps whose target is on the page and laid out", async () => {
  target("first");
  target("collapsed", null);
  target("last");

  start([step("first"), step("missing"), step("collapsed"), step("last")]);
  await wait(0);

  expect(shownStep()).toBe("Step 1 of 2 · About first");
});

it("keeps a step whose screen preparation brings its own target", async () => {
  target("first");

  start([step("first"), step("other-tab", { bringsOwnTarget: true })]);
  await wait(0);

  expect(shownStep()).toBe("Step 1 of 2 · About first");
});

it("prepares the first step's screen once, when the tour starts", async () => {
  target("first");
  const onBeforeStep = vi.fn();
  const steps = [step("first", { onBeforeStep })];

  const { rerender } = start(steps);
  await wait(0);
  rerender(<Tour run setRun={vi.fn()} steps={[...steps]} />);
  await wait(500);

  expect(onBeforeStep).toHaveBeenCalledOnce();
});

it("waits for a target that loads late and starts once it is there", async () => {
  start([step("chats")]);
  await wait(1000);
  expect(shownStep()).toBeNull();

  target("chats");
  await wait(200);

  expect(shownStep()).toBe("Step 1 of 1 · About chats");
});

it("closes itself when nothing to show appears within eight seconds", async () => {
  const { setRun } = start([step("never")]);

  await wait(7800);
  expect(setRun).not.toHaveBeenCalled();

  await wait(200);
  expect(setRun).toHaveBeenCalledExactlyOnceWith(false);
});

it("takes the first visible step of a group and drops the alternatives", async () => {
  target("globe");
  target("photos");
  target("bio");

  start([
    step("globe", { oneOf: "photo" }),
    step("photos", { oneOf: "photo" }),
    step("bio"),
  ]);
  await wait(0);

  expect(shownStep()).toBe("Step 1 of 2 · About globe");
});

it("waits a second for a group's preferred target, then falls back", async () => {
  target("photos");
  target("bio");

  start([
    step("globe", { oneOf: "photo" }),
    step("photos", { oneOf: "photo" }),
    step("bio"),
  ]);
  await wait(800);
  expect(shownStep()).toBeNull();

  await wait(200);
  expect(shownStep()).toBe("Step 1 of 2 · About photos");
});

it("uses a group's preferred target when it arrives within that second", async () => {
  target("photos");

  start([
    step("globe", { oneOf: "photo" }),
    step("photos", { oneOf: "photo" }),
  ]);
  await wait(400);
  target("globe");
  await wait(200);

  expect(shownStep()).toBe("Step 1 of 1 · About globe");
});

it("prepares the next step's screen, then moves to it and back", async () => {
  target("itinerary");
  target("chat");
  const onBeforeStep = vi.fn();

  start([step("itinerary"), step("chat", { onBeforeStep })]);
  await wait(0);
  click(getByText("Next"));

  expect(onBeforeStep).toHaveBeenCalledOnce();
  await wait(200);
  expect(shownStep()).toBe("Step 2 of 2 · About chat");

  click(getByText("Back"));
  await wait(200);
  expect(shownStep()).toBe("Step 1 of 2 · About itinerary");
});

it("starts a tour played again from its first step", async () => {
  target("itinerary");
  target("chat");
  const steps = [step("itinerary"), step("chat")];
  const { rerender } = start(steps);
  await wait(0);
  click(getByText("Next"));
  await wait(200);

  rerender(<Tour run={false} setRun={vi.fn()} steps={steps} />);
  await wait(0);
  expect(shownStep()).toBeNull();
  expect(hole()).toBeUndefined();

  rerender(<Tour run setRun={vi.fn()} steps={steps} />);
  await wait(200);
  expect(shownStep()).toBe("Step 1 of 2 · About itinerary");
});

it.each(["Finish", "Skip tour", "×"])(
  "closes the tour when the visitor presses %s",
  async (control) => {
    target("only");
    const { onClose, setRun } = start([step("only")]);
    await wait(0);

    click(getByText(control));

    expect(setRun).toHaveBeenCalledExactlyOnceWith(false);
    expect(onClose).toHaveBeenCalledOnce();
  }
);

it("marks a highlighted step's target only while that step is shown", async () => {
  const menu = target("menu");
  target("next");

  start([step("menu", { highlight: true }), step("next")]);
  await wait(0);
  expect(menu.classList.contains("tour-highlighted")).toBe(true);

  click(getByText("Next"));
  await wait(200);
  expect(menu.classList.contains("tour-highlighted")).toBe(false);
});

/** The spotlight's hole: the box the dimmed page leaves clear. */
const hole = () => {
  const box = [...document.body.children].find(
    (element): element is HTMLElement =>
      element instanceof HTMLElement &&
      element.style.borderRadius !== "" &&
      element.style.opacity === ""
  );
  return (
    box && {
      height: box.style.height,
      left: box.style.left,
      radius: box.style.borderRadius,
      top: box.style.top,
      width: box.style.width,
    }
  );
};

it.each([
  [
    "pads the target by 6 px",
    new DOMRect(50, 100, 200, 200),
    { height: "212px", left: "44px", top: "94px", width: "212px" },
  ],
  [
    "keeps a target taller than the screen to its top 60 % on screen",
    new DOMRect(-20, -200, 1120, 2200),
    { height: "600px", left: "8px", top: "8px", width: "984px" },
  ],
])("cuts the spotlight around the target: %s", async (_case, box, expected) => {
  target("gallery", box);

  start([step("gallery")]);
  await wait(0);

  expect(hole()).toEqual({ ...expected, radius: "12px" });
});

it("rounds the spotlight like a round target", async () => {
  target("globe").style.borderRadius = "50%";

  start([step("globe")]);
  await wait(0);

  expect(hole()?.radius).toBe("50%");
});

it("fits a compact step's spotlight to the target's content", async () => {
  target("tab", new DOMRect(0, 700, 340, 60));
  // A Range has no box in jsdom either: the tab's icon and label sit here.
  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => new DOMRect(150, 710, 40, 40),
  });
  onTestFinished(() => {
    Reflect.deleteProperty(Range.prototype, "getBoundingClientRect");
  });

  start([step("tab", { spotlight: "compact" })]);
  await wait(0);

  expect(hole()).toMatchObject({
    height: "52px",
    left: "144px",
    top: "704px",
    width: "52px",
  });
});

it("moves the spotlight with its target when the page scrolls", async () => {
  const card = target("card", new DOMRect(50, 300, 200, 100));
  start([step("card")]);
  await wait(0);

  boxes.set(card, new DOMRect(50, 120, 200, 100));
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });

  expect(hole()?.top).toBe("114px");
});
