// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from "vitest";

import Dropdown, { type DropdownProps } from "../../src/components/Dropdown";
import { click, getByText } from "../support/render";

const options = ["Afghanistan", "Argentina", "Armenia", "Brazil"].map(
  (name) => ({ label: `🏳️ ${name}`, value: name })
);

const press = (key: string, modifiers: KeyboardEventInit = {}) =>
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { cancelable: true, key, ...modifiers })
    );
  });

const activeLabel = () =>
  document.querySelector(".ui-dropdown li.active")?.textContent;

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
const open = (props: Partial<DropdownProps<string>> = {}) => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() =>
    root.render(
      createElement(Dropdown<string>, {
        onSelect: vi.fn(),
        options,
        setVisible: vi.fn(),
        typeAhead: true,
        visible: true,
        ...props,
      })
    )
  );
  return root;
};

beforeEach(() => {
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  // jsdom lays nothing out, so it has no scrolling.
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Dropdown typeAhead", () => {
  it("jumps to what is typed, scrolls to it and picks it on Enter", () => {
    const onSelect = vi.fn();
    open({ onSelect, setVisible: vi.fn() });

    press("a");
    press("r");
    press("g");

    expect(activeLabel()).toBe("🏳️ Argentina");
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();

    press("Enter");
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("Argentina");
  });

  it("moves with the arrows and closes on Escape", () => {
    const setVisible = vi.fn();
    open({ onSelect: vi.fn(), setVisible });

    press("ArrowDown");
    expect(activeLabel()).toBe("🏳️ Afghanistan");
    press("ArrowUp");
    expect(activeLabel()).toBe("🏳️ Brazil");

    press("Escape");
    expect(setVisible).toHaveBeenCalledWith(false);
  });

  it("leaves Enter alone until the keyboard is on an option", () => {
    const onSelect = vi.fn();
    open({ onSelect, setVisible: vi.fn() });
    const enter = new KeyboardEvent("keydown", {
      cancelable: true,
      key: "Enter",
    });

    act(() => {
      document.dispatchEvent(enter);
    });

    expect(enter.defaultPrevented).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("starts the search afresh after a pause", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    open();

    press("a");
    vi.advanceTimersByTime(1001);
    press("b");

    expect(activeLabel()).toBe("🏳️ Brazil");
  });

  it("leaves keys pressed with a modifier to the browser", () => {
    open();

    press("b", { metaKey: true });
    press("b", { ctrlKey: true });
    press("b", { altKey: true });

    expect(activeLabel()).toBeUndefined();
  });

  it("lets a lone space press the focused button", () => {
    open();
    const space = new KeyboardEvent("keydown", { cancelable: true, key: " " });

    act(() => {
      document.dispatchEvent(space);
    });

    expect(space.defaultPrevented).toBe(false);
    expect(activeLabel()).toBeUndefined();
  });
});

describe("Dropdown", () => {
  /** The field the list opens from, as Autocomplete passes it. */
  const anchor = () => {
    const field = document.createElement("input");
    document.body.append(field);
    onTestFinished(() => field.remove());
    return { current: field };
  };

  it("picks the option clicked", () => {
    const onSelect = vi.fn();
    open({ onSelect, typeAhead: false });

    click(getByText("🏳️ Brazil"));

    expect(onSelect).toHaveBeenCalledExactlyOnceWith("Brazil");
  });

  it("closes on a click outside, but not on its anchor or inside the list", () => {
    const setVisible = vi.fn();
    const anchorEl = anchor();
    open({ anchorEl, setVisible });

    click(anchorEl.current);
    click(getByText("🏳️ Brazil"));
    expect(setVisible).not.toHaveBeenCalled();

    act(() => {
      document.body.click();
    });
    expect(setVisible).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("prints a heading wherever the section changes", () => {
    open({
      options: [
        { label: "Cancún", section: "Cities", value: "CUN-city" },
        { label: "Cartagena", section: "Cities", value: "CTG-city" },
        { label: "Cancún International", section: "Airports", value: "CUN" },
        { label: "Cartagena Hilton", section: "Hotels", value: "hotel-1" },
      ],
    });

    const rows = [...document.body.querySelectorAll("li")].map((row) => [
      row.getAttribute("role") === "presentation" ? "heading" : "option",
      row.textContent,
    ]);
    expect(rows).toEqual([
      ["heading", "Cities"],
      ["option", "Cancún"],
      ["option", "Cartagena"],
      ["heading", "Airports"],
      ["option", "Cancún International"],
      ["heading", "Hotels"],
      ["option", "Cartagena Hilton"],
    ]);
  });

  it("ticks the options already selected", () => {
    open({ selectedOptions: ["Argentina", "Brazil"] });

    const ticked = [
      ...document.body.querySelectorAll<HTMLInputElement>(
        "input[type='checkbox']"
      ),
    ]
      .filter((box) => box.checked)
      .map((box) => box.closest("li")?.textContent);
    expect(ticked).toEqual(["🏳️ Argentina", "🏳️ Brazil"]);
  });

  it.each([
    [
      "under a narrow field, 320 px wide",
      1000,
      new DOMRect(100, 100, 200, 40),
      ["140px", "100px", "320px"],
    ],
    [
      "as wide as a wide field",
      1000,
      new DOMRect(100, 100, 500, 40),
      ["140px", "100px", "500px"],
    ],
    [
      "inside the right edge",
      1000,
      new DOMRect(900, 100, 80, 40),
      ["140px", "664px", "320px"],
    ],
    [
      "inside a phone's screen",
      340,
      new DOMRect(10, 100, 200, 40),
      ["140px", "10px", "308px"],
    ],
  ])("sits %s", (_case, screenWidth, box, [top, left, width]) => {
    vi.useFakeTimers();
    vi.stubGlobal("innerWidth", screenWidth);
    const anchorEl = anchor();
    vi.spyOn(anchorEl.current, "getBoundingClientRect").mockReturnValue(box);
    open({ anchorEl });

    act(() => {
      vi.advanceTimersToNextFrame();
    });

    const list = getByText("🏳️ Brazil").closest("ul") as HTMLElement;
    expect([list.style.top, list.style.left, list.style.width]).toEqual([
      top,
      left,
      width,
    ]);
  });
});
