// @vitest-environment jsdom
import { act } from "react";
import { expect, it, vi } from "vitest";

import NumberInput from "../../src/components/NumberInput";
import { change, click, queryAllByRole, render } from "../support/render";

const ADULTS = { plural: "adults", singular: "adult" };

const field = () => queryAllByRole("textbox")[0] as HTMLInputElement;

/** The minus and plus buttons: the only buttons without a name. */
const steppers = () => {
  const [less, more] = queryAllByRole("button", "");
  return { less: less as HTMLElement, more: more as HTMLElement };
};

const leave = (input: HTMLInputElement) =>
  act(() => {
    input.focus();
    input.blur();
  });

it("names the count with its unit, one or more", () => {
  render(
    <NumberInput defaultValue={1} maxValue={9} minValue={1} unit={ADULTS} />
  );
  expect(field().value).toBe("1 adult");

  click(steppers().more);

  expect(field().value).toBe("2 adults");
});

it("steps up and down without leaving the limits", () => {
  const onChange = vi.fn();
  render(
    <NumberInput
      defaultValue={2}
      maxValue={3}
      minValue={1}
      onChange={onChange}
    />
  );

  click(steppers().more);
  click(steppers().more);
  click(steppers().less);
  click(steppers().less);
  click(steppers().less);

  expect(onChange.mock.calls).toEqual([[3], [2], [1]]);
});

it.each([
  ["above the maximum", "12", 5],
  ["below the minimum", "0", 1],
  ["empty", "", 1],
])(
  "settles a number typed %s on the nearest limit",
  (_case, typed, settled) => {
    const onChange = vi.fn();
    render(
      <NumberInput
        defaultValue={2}
        maxValue={5}
        minValue={1}
        onChange={onChange}
      />
    );

    change(field(), typed);
    leave(field());

    expect(onChange).toHaveBeenLastCalledWith(settled);
    expect(field().value.trim()).toBe(String(settled));
  }
);

it("keeps a number typed within the limits", () => {
  const onChange = vi.fn();
  render(
    <NumberInput
      defaultValue={2}
      maxValue={5}
      minValue={1}
      onChange={onChange}
    />
  );

  change(field(), "4");
  leave(field());

  expect(onChange.mock.calls).toEqual([["4"]]);
  expect(field().value.trim()).toBe("4");
});
