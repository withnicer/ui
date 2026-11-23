// @vitest-environment jsdom
import { act, useRef, useState } from "react";
import type { ComponentProps } from "react";
import { afterEach, expect, it, vi } from "vite-plus/test";

import Actions from "../../src/components/Actions";
import {
  click,
  getByRole,
  keyDown,
  queryAllByRole,
  queryByRole,
  render,
} from "../support/render";

type Option = ComponentProps<typeof Actions>["options"][number];

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** A "More" button that opens its actions, as a table row's menu does. */
function Menu({ options }: { options: Option[] }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  return (
    <>
      <button ref={trigger} type="button">
        More
      </button>
      <Actions
        options={options}
        setVisible={setVisible}
        triggerRef={trigger}
        visible={visible}
      />
    </>
  );
}

const option = (label: string, extra: Partial<Option> = {}): Option => ({
  action: vi.fn(),
  label,
  ...extra,
});

const openMenu = (options: Option[]) => {
  render(<Menu options={options} />);
  click(getByRole("button", "More"));
};

const listed = () =>
  queryAllByRole("button")
    .map((item) => item.textContent)
    .filter((label) => label !== "More");

it("opens from its trigger with the actions that are not hidden", () => {
  render(
    <Menu
      options={[
        option("Edit"),
        option("Duplicate", { hidden: true }),
        option("Delete", { destructive: true }),
      ]}
    />
  );
  expect(listed()).toEqual([]);

  click(getByRole("button", "More"));

  expect(listed()).toEqual(["Edit", "Delete"]);
});

it("runs the action picked and closes", () => {
  const edit = option("Edit");
  openMenu([edit, option("Delete")]);

  click(getByRole("button", "Edit"));

  expect(edit.action).toHaveBeenCalledOnce();
  expect(listed()).toEqual([]);
});

it.each(["Enter", " "])("runs the action focused when %j is pressed", (key) => {
  const edit = option("Edit");
  openMenu([edit]);

  keyDown(getByRole("button", "Edit"), key);

  expect(edit.action).toHaveBeenCalledOnce();
  expect(listed()).toEqual([]);
});

it("keeps a disabled action out of reach", () => {
  const remove = option("Delete", { disabled: true });
  openMenu([remove]);
  const item = getByRole("button", "Delete");

  click(item);
  keyDown(item, "Enter");

  expect(item.getAttribute("aria-disabled")).toBe("true");
  expect(item.tabIndex).toBe(-1);
  expect(remove.action).not.toHaveBeenCalled();
  expect(listed()).toEqual(["Delete"]);
});

it("closes on a click anywhere else", () => {
  openMenu([option("Edit")]);

  act(() => {
    document.body.click();
  });

  expect(queryByRole("button", "Edit")).toBeNull();
});

it("sits under its trigger and closes once the trigger scrolls off screen", () => {
  vi.useFakeTimers();
  vi.stubGlobal("innerWidth", 1000);
  vi.stubGlobal("innerHeight", 800);
  let triggerBox = new DOMRect(800, 100, 100, 30);
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    () => triggerBox
  );
  openMenu([option("Edit")]);
  const list = getByRole("button", "Edit").parentElement as HTMLElement;

  act(() => {
    vi.advanceTimersToNextFrame();
  });
  expect([list.style.top, list.style.right]).toEqual(["134px", "100px"]);

  triggerBox = new DOMRect(800, -60, 100, 30);
  act(() => {
    vi.advanceTimersToNextFrame();
  });
  expect(queryByRole("button", "Edit")).toBeNull();
});
