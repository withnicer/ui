// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";

import { CalendarV2 } from "../../src/components/CalendarV2";
import type { CalendarPropsV2 } from "../../src/components/CalendarV2";
import {
  click,
  getByRole,
  getByText,
  keyDown,
  queryAllByRole,
  queryByRole,
  render,
} from "../support/render";

beforeEach(() => {
  // Today is Wednesday 21 October 2026.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-21T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

const open = (props: Partial<CalendarPropsV2> = {}) => {
  const onChange = vi.fn();
  const setVisible = vi.fn();
  const view = render(
    <CalendarV2
      onChange={onChange}
      setVisible={setVisible}
      visible
      {...props}
    />
  );
  return { ...view, onChange, setVisible };
};

/** The arrows beside the title: the only buttons without a name. */
const arrows = () => {
  const [back, forward] = queryAllByRole("button", "");
  return { back, forward };
};

const day = (n: number) => getByRole("button", String(n)) as HTMLButtonElement;

const pick = (...days: number[]) => {
  for (const n of days) {
    click(day(n));
  }
};

/** The weekday column an element of the grid sits in, 0 for Sunday. */
const column = (element: Element) =>
  [...(element.parentElement?.children ?? [])].indexOf(element) % 7;

it.each([
  ["the picked start", { defaultFrom: "2027-03-14" }, "March 2027"],
  ["the view date", { initialViewDate: "2025-01-05" }, "January 2025"],
  ["today", {}, "October 2026"],
])("opens on the month of %s", (_case, props, title) => {
  open(props);

  expect(getByRole("button", title)).toBeTruthy();
});

it.each([
  ["2026-10-21", "Thu", 31],
  ["2027-02-01", "Mon", 28],
  ["2028-02-01", "Tue", 29],
])(
  "lays out the month of %s from its first weekday, %s, over %i days",
  (initialViewDate, weekday, days) => {
    open({ initialViewDate });

    expect(column(day(1))).toBe(column(getByText(weekday)));
    expect(day(days)).toBeTruthy();
    expect(queryByRole("button", String(days + 1))).toBeNull();
  }
);

it("steps through the months across the turn of the year", () => {
  open({ initialViewDate: "2027-01-15" });

  click(arrows().back);
  expect(getByRole("button", "December 2026")).toBeTruthy();

  click(arrows().forward);
  click(arrows().forward);
  expect(getByRole("button", "February 2027")).toBeTruthy();

  click(arrows().back);
  expect(getByRole("button", "January 2027")).toBeTruthy();
});

it("zooms out to the months and the years from the title, and in by picking", () => {
  open();

  click(getByRole("button", "October 2026"));
  click(getByRole("button", "2026"));
  expect(getByRole("button", "2020–2030")).toBeTruthy();

  click(getByRole("button", "2028"));
  expect(getByRole("button", "2028")).toBeTruthy();
  click(getByRole("button", "March"));

  expect(getByRole("button", "March 2028")).toBeTruthy();
});

it("zooms out and picks a year and a month from the keyboard", () => {
  open();

  keyDown(getByRole("button", "October 2026"), "Enter");
  keyDown(getByRole("button", "2026"), " ");
  keyDown(getByRole("button", "2027"), "Enter");
  keyDown(getByRole("button", "May"), " ");

  expect(getByRole("button", "May 2027")).toBeTruthy();
});

it("comes back to the days from the years through the title", () => {
  open();

  click(getByRole("button", "October 2026"));
  click(getByRole("button", "2026"));
  click(getByRole("button", "2020–2030"));

  expect(getByRole("button", "October 2026")).toBeTruthy();
});

it("steps a year at a time over the months and a decade over the years", () => {
  open();
  click(getByRole("button", "October 2026"));

  click(arrows().forward);
  click(arrows().forward);
  click(arrows().back);
  expect(getByRole("button", "2027")).toBeTruthy();

  click(getByRole("button", "2027"));
  click(arrows().forward);
  expect(getByRole("button", "2030–2040")).toBeTruthy();
  click(arrows().back);
  click(arrows().back);
  expect(getByRole("button", "2010–2020")).toBeTruthy();
});

it("goes back to the days from the months without picking one", () => {
  open();
  click(getByRole("button", "October 2026"));

  click(getByRole("button", "Back"));

  expect(getByRole("button", "October 2026")).toBeTruthy();
});

it.each([
  ["one day", false, [5], ["2026-10-05", null]],
  ["another day instead", false, [5, 9], ["2026-10-09", null]],
  ["the start of a range", true, [5], ["2026-10-05", null]],
  ["a range", true, [5, 9], ["2026-10-05", "2026-10-09"]],
  ["a range picked backwards", true, [9, 5], ["2026-10-05", "2026-10-09"]],
  ["a new range after a full one", true, [5, 9, 12], ["2026-10-12", null]],
])("reports %s", (_case, double, days, range) => {
  const { onChange } = open({ double });

  pick(...days);

  expect(onChange).toHaveBeenLastCalledWith(...range);
});

it("does not let a range end on the day it starts", () => {
  open({ double: true });

  pick(9);

  expect(day(9).disabled).toBe(true);
  expect(day(10).disabled).toBe(false);
});

it("shows the range picked, its ends and the days between", () => {
  open({ double: true });

  pick(5, 8);

  expect([4, 5, 6, 7, 8, 9].map((n) => day(n).className.trim())).toEqual([
    "",
    "selected",
    "between",
    "between",
    "selected",
    "",
  ]);
  expect(day(21).className.trim()).toBe("today");
});

it("disables the days outside the dates allowed", () => {
  open({ maxDate: "2026-10-20", minDate: "2026-10-10" });

  expect([9, 10, 20, 21].map((n) => day(n).disabled)).toEqual([
    true,
    false,
    false,
    true,
  ]);
});

it("confirms and closes on Done", () => {
  const onDone = vi.fn();
  const { setVisible } = open({ onDone });

  click(getByRole("button", "Done"));

  expect(onDone).toHaveBeenCalledOnce();
  expect(setVisible).toHaveBeenCalledExactlyOnceWith(false);
});

it("closes without confirming on a click outside, and stays open on one inside", () => {
  const onDone = vi.fn();
  const { setVisible } = open({ onDone });

  click(getByText("Wed"));
  expect(setVisible).not.toHaveBeenCalled();

  // The backdrop the panel sits on.
  click(getByRole("button", "Done").parentElement?.parentElement as Element);
  expect(setVisible).toHaveBeenCalledExactlyOnceWith(false);
  expect(onDone).not.toHaveBeenCalled();
});

it("shows nothing while it is closed", () => {
  open({ visible: false });

  expect(queryByRole("button", "Done")).toBeNull();
});

it("reports the range it opens with", () => {
  const { onChange } = open({
    defaultFrom: "2026-11-02",
    defaultTo: "2026-11-06",
    double: true,
  });

  expect(onChange).toHaveBeenCalledExactlyOnceWith("2026-11-02", "2026-11-06");
});

it("takes defaults that arrive after it opened, and keeps the picks after that", () => {
  const onChange = vi.fn();
  const calendar = (defaultFrom?: string) => (
    <CalendarV2
      defaultFrom={defaultFrom}
      double
      onChange={onChange}
      setVisible={vi.fn()}
      visible
    />
  );
  const { rerender } = render(calendar());

  rerender(calendar("2027-05-03"));
  expect(getByRole("button", "May 2027")).toBeTruthy();
  expect(day(3).className.trim()).toBe("selected");

  rerender(calendar("2027-06-01"));
  expect(getByRole("button", "May 2027")).toBeTruthy();
});
