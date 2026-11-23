// @vitest-environment jsdom
import { act } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";

import DateInput from "../../src/components/DateInput";
import {
  click,
  getByPlaceholderText,
  getByRole,
  getByText,
  queryByRole,
  render,
} from "../support/render";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-21T10:30:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

const field = () => getByPlaceholderText("Select date");

it("opens the calendar from the field and fills in the day picked", () => {
  const onChange = vi.fn();
  render(<DateInput onChange={onChange} />);
  expect(queryByRole("button", "25")).toBeNull();

  act(() => {
    field().focus();
  });
  click(getByRole("button", "25"));

  expect(field().value).toBe("2026-10-25");
  expect(onChange).toHaveBeenCalledExactlyOnceWith("2026-10-25");
});

it("starts from the date its host gives, on that month", () => {
  render(<DateInput defaultDate="2026-12-24" />);

  act(() => {
    field().focus();
  });

  expect(field().value).toBe("2026-12-24");
  expect(getByText("December 2026")).toBeTruthy();
});
