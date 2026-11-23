// @vitest-environment jsdom
import { act, useState } from "react";
import type { ComponentProps } from "react";
import { expect, it, vi } from "vite-plus/test";

import Autocomplete from "../../src/components/Autocomplete";
import {
  change,
  click,
  getByText,
  queryAllByRole,
  queryAllByText,
  render,
} from "../support/render";

type Props = ComponentProps<typeof Autocomplete<string>>;

const CITIES = [
  { label: "Cancún", value: "CUN" },
  { label: "Cartagena", value: "CTG" },
];

/** A destination search that keeps what is typed, as the hosts do. */
function Destination(props: Partial<Props>) {
  const [text, setText] = useState("");
  return (
    <Autocomplete<string>
      inputValue={text}
      label="Destination"
      onInputChange={setText}
      options={CITIES}
      {...props}
    />
  );
}

const field = () => queryAllByRole("textbox")[0] as HTMLInputElement;

/** The rows of the open suggestion lists. */
const suggested = () =>
  [...document.body.querySelectorAll("ul li")].map((row) => row.textContent);

it("suggests once something is typed and hides the list when it is cleared", () => {
  render(<Destination />);
  expect(suggested()).toEqual([]);

  change(field(), "Ca");
  expect(suggested()).toEqual(["Cancún", "Cartagena"]);

  change(field(), "");
  expect(suggested()).toEqual([]);
});

it.each([
  ["fewer than 3 letters", "Ca", false, "Type 3 letters to search"],
  ["a search still loading", "Cara", true, "Loading..."],
  ["a short search still loading", "Ca", true, "Loading..."],
  ["a search that found nothing", "Cara", false, "No results"],
])(
  "says so when there are no options for %s",
  (_case, typed, isLoading, says) => {
    render(<Destination isLoading={isLoading} options={[]} />);

    change(field(), typed);

    expect(suggested()).toEqual([says]);
  }
);

it("offers the default options when the empty field gets focus", () => {
  render(
    <Destination defaultOptions={[{ label: "Recent: Lima", value: "LIM" }]} />
  );

  act(() => {
    field().focus();
  });

  expect(suggested()).toEqual(["Recent: Lima"]);
});

it("reports the option picked and closes", () => {
  const onSelectOption = vi.fn();
  render(<Destination onSelectOption={onSelectOption} />);
  change(field(), "Ca");

  click(getByText("Cartagena"));

  expect(onSelectOption).toHaveBeenCalledExactlyOnceWith("CTG");
  expect(suggested()).toEqual([]);
});

it("stays open to pick another when several can be picked", () => {
  const onSelectOption = vi.fn();
  render(<Destination multiple onSelectOption={onSelectOption} />);
  change(field(), "Ca");

  click(getByText("Cancún"));
  click(getByText("Cartagena"));

  expect(onSelectOption.mock.calls).toEqual([["CUN"], ["CTG"]]);
  expect(suggested()).toEqual(["Cancún", "Cartagena"]);
});

it("does nothing when the notice in place of options is clicked", () => {
  const onSelectOption = vi.fn();
  render(<Destination onSelectOption={onSelectOption} options={[]} />);
  change(field(), "Ca");

  click(getByText("Type 3 letters to search"));

  expect(onSelectOption).not.toHaveBeenCalled();
  expect(queryAllByText("Type 3 letters to search")).toHaveLength(1);
});
