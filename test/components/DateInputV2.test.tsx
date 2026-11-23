// @vitest-environment jsdom
import { expect, it, vi } from "vite-plus/test";

import { DateInputV2 } from "../../src/components/DateInputV2";
import {
  click,
  getByPlaceholderText,
  getByRole,
  getByText,
  keyDown,
  render,
} from "../support/render";

const field = () => getByPlaceholderText("Select date");

it.each([
  ["2026-10-21", "10-21-2026"],
  ["", ""],
  ["null", ""],
  [undefined, ""],
])("shows %j as %j", (value, shown) => {
  render(<DateInputV2 setCalendarVisible={vi.fn()} value={value} />);

  expect(field().value).toBe(shown);
});

it("names its field and its button after the label", () => {
  render(<DateInputV2 label="Check-in" setCalendarVisible={vi.fn()} />);

  expect(getByText("Check-in").getAttribute("for")).toBe(field().id);
  expect(getByRole("button", "Choose check-in")).toBeTruthy();
});

it("names its button for a date when it has no label", () => {
  render(<DateInputV2 setCalendarVisible={vi.fn()} />);

  expect(getByRole("button", "Choose date")).toBeTruthy();
});

it.each([
  ["a click on the field", () => click(field())],
  ["Enter on the field", () => keyDown(field(), "Enter")],
  ["Space on the field", () => keyDown(field(), " ")],
  ["its button", () => click(getByRole("button", "Choose date"))],
])("opens the calendar from %s", (_case, open) => {
  const setCalendarVisible = vi.fn();
  render(<DateInputV2 setCalendarVisible={setCalendarVisible} />);

  open();

  expect(setCalendarVisible).toHaveBeenCalledExactlyOnceWith(true);
});

it("stays shut while disabled", () => {
  const setCalendarVisible = vi.fn();
  render(<DateInputV2 disabled setCalendarVisible={setCalendarVisible} />);

  click(field());
  keyDown(field(), "Enter");
  click(getByRole("button", "Choose date"));

  expect(setCalendarVisible).not.toHaveBeenCalled();
});
