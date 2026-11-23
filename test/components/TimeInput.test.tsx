// @vitest-environment jsdom
import { expect, it, vi } from "vite-plus/test";

import TimeInput from "../../src/components/TimeInput";
import { change, click, getByRole, render } from "../support/render";

/** The native time field; it has no label of its own. */
const field = () => {
  const input =
    document.body.querySelector<HTMLInputElement>("input[type='time']");
  if (!input) {
    throw new Error("No time field");
  }
  return input;
};

/** The meridian the AM/PM toggle shows as picked. */
const meridian = () =>
  ["AM", "PM"].find(
    (label) => getByRole("button", label).className === "active"
  );

it.each([
  ["14:30", "02:30", "PM"],
  ["09:15", "09:15", "AM"],
  ["00:00", "12:00", "AM"],
  ["12:05", "12:05", "PM"],
])("shows %s as %s %s", (defaultTime, shown, half) => {
  render(<TimeInput defaultTime={defaultTime} />);

  expect(field().value).toBe(shown);
  expect(meridian()).toBe(half);
});

it.each([
  ["09:15", "PM", "21:15"],
  ["21:15", "AM", "09:15"],
  ["12:30", "AM", "00:30"],
  ["00:30", "PM", "12:30"],
])("reports %s moved to %s as %s", (defaultTime, picked, reported) => {
  const onChange = vi.fn();
  render(<TimeInput defaultTime={defaultTime} onChange={onChange} />);

  click(getByRole("button", picked));

  expect(onChange).toHaveBeenCalledExactlyOnceWith(reported);
});

it.each(["15:45", "07:05", "12:00"])("reports a typed %s as it is", (typed) => {
  const onChange = vi.fn();
  render(<TimeInput defaultTime="09:00" onChange={onChange} />);

  change(field(), typed);

  expect(onChange).toHaveBeenCalledExactlyOnceWith(typed);
});

it("moves the meridian to the half of the day typed", () => {
  render(<TimeInput defaultTime="09:00" />);

  change(field(), "15:45");

  expect(meridian()).toBe("PM");
});

it.each([
  ["07:00", "08:30", "18:15", "08:30"],
  ["08:10", "08:30", "18:15", "08:30"],
  ["12:00", "08:30", "18:15", "12:00"],
  ["18:40", "08:30", "18:15", "18:15"],
  ["19:00", "08:30", "18:15", "18:15"],
  // The limit on the other side of noon from the time typed: a drop-off
  // the same day as a 14:00 pick-up cannot be at 09:00, nor at 02:00.
  ["09:00", "14:00", "23:59", "14:00"],
  ["13:00", "00:00", "10:00", "10:00"],
])(
  "holds %s typed between %s and %s to %s",
  (typed, minTime, maxTime, reported) => {
    const onChange = vi.fn();
    render(
      <TimeInput
        defaultTime="11:11"
        maxTime={maxTime}
        minTime={minTime}
        onChange={onChange}
      />
    );

    change(field(), typed);

    expect(onChange).toHaveBeenCalledExactlyOnceWith(reported);
  }
);
