// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";

import Calendar from "../../src/components/Calendar";
import {
  click,
  getByRole,
  getByText,
  queryAllByRole,
  render,
} from "../support/render";

const today = (iso: string) => vi.setSystemTime(new Date(iso));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  // Wednesday 21 October 2026, mid-morning.
  today("2026-10-21T10:30:00Z");
});

afterEach(() => {
  vi.useRealTimers();
});

const open = (props: Partial<ComponentProps<typeof Calendar>> = {}) => {
  const onChange = vi.fn();
  const setVisible = vi.fn();
  render(
    <Calendar onChange={onChange} setVisible={setVisible} visible {...props} />
  );
  return { onChange, setVisible };
};

/** The arrows beside the title: the only buttons without a name. */
const arrows = () => {
  const [back, forward] = queryAllByRole("button", "");
  return { back, forward };
};

const day = (n: number) => getByRole("button", String(n)) as HTMLButtonElement;

it.each([
  ["the default date", { defaultFrom: "2027-03-14" }, "March 2027"],
  ["today", {}, "October 2026"],
])("opens on the month of %s", (_case, props, title) => {
  open(props);

  expect(getByText(title)).toBeTruthy();
});

it("disables the days already gone and keeps today", () => {
  open();

  expect([20, 21, 22].map((n) => day(n).disabled)).toEqual([
    true,
    false,
    false,
  ]);
});

it("keeps today when it is the first day of a month that starts on Sunday", () => {
  // 1 November 2026 is a Sunday: the first cell of the grid.
  today("2026-11-01T10:30:00Z");
  open();

  expect(day(1).disabled).toBe(false);
});

it("steps through the months across the turn of the year", () => {
  open({ defaultFrom: "2026-12-10" });

  click(arrows().forward);
  expect(getByText("January 2027")).toBeTruthy();

  click(arrows().back);
  click(arrows().back);
  expect(getByText("November 2026")).toBeTruthy();
});

it.each([
  ["one day", false, [25], ["2026-10-25", null]],
  ["another day instead", false, [25, 28], ["2026-10-28", null]],
  ["a range", true, [23, 27], ["2026-10-23", "2026-10-27"]],
  ["a range picked backwards", true, [27, 23], ["2026-10-23", "2026-10-27"]],
  ["a new range after a full one", true, [23, 27, 29], ["2026-10-29", null]],
])("reports %s", (_case, double, days, range) => {
  const { onChange } = open({ double });

  for (const n of days) {
    click(day(n));
  }

  expect(onChange).toHaveBeenLastCalledWith(...range);
});

it("reports the dates it opens with", () => {
  const { onChange } = open({
    defaultFrom: "2026-11-02",
    defaultTo: "2026-11-06",
  });

  expect(onChange).toHaveBeenCalledExactlyOnceWith("2026-11-02", "2026-11-06");
});

it("disables the days outside the dates allowed", () => {
  open({ maxDate: "2026-10-28", minDate: "2026-10-24" });

  expect([23, 24, 28, 29].map((n) => day(n).disabled)).toEqual([
    true,
    false,
    false,
    true,
  ]);
});

it("closes on Done and on a click outside", () => {
  const { setVisible } = open();

  click(getByRole("button", "Done"));
  // The backdrop the panel sits on.
  click(getByRole("button", "Done").parentElement?.parentElement as Element);

  expect(setVisible.mock.calls).toEqual([[false], [false]]);
});
