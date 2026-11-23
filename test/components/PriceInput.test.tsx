// @vitest-environment jsdom
import { expect, it, vi } from "vitest";

import PriceInput from "../../src/components/PriceInput";
import {
  change,
  getByRole,
  getByText,
  queryByRole,
  render,
  selectOption,
} from "../support/render";

const amount = () => getByRole("textbox", "Price") as HTMLInputElement;

it.each([
  ["12345", "123.45", "12345"],
  ["5", "0.05", "5"],
  ["1,234.567", "12,345.67", "1234567"],
])("reads %s typed as $%s, reported in cents", (typed, shown, cents) => {
  const onChange = vi.fn();
  render(<PriceInput aria-label="Price" onChange={onChange} />);

  change(amount(), typed);

  expect(amount().value).toBe(shown);
  expect(onChange).toHaveBeenCalledExactlyOnceWith(cents);
});

it.each([
  ["below the minimum", "500", "10.00", "1000"],
  ["above the maximum", "99999", "500.00", "50000"],
])("holds an amount %s to the limit", (_case, typed, shown, cents) => {
  const onChange = vi.fn();
  render(
    <PriceInput aria-label="Price" max={500} min={10} onChange={onChange} />
  );

  change(amount(), typed);

  expect(amount().value).toBe(shown);
  expect(onChange).toHaveBeenCalledExactlyOnceWith(cents);
});

it("shows the amount its host sets", () => {
  const { rerender } = render(
    <PriceInput aria-label="Price" defaultValue="2500" />
  );
  expect(amount().value).toBe("25.00");

  rerender(<PriceInput aria-label="Price" defaultValue="990" />);

  expect(amount().value).toBe("9.90");
});

it("offers the currencies when asked, and reports the one picked", () => {
  const onCurrencyChange = vi.fn();
  render(
    <PriceInput
      currencySelector
      defaultCurrency="EUR"
      onCurrencyChange={onCurrencyChange}
    />
  );
  const currency = getByRole("combobox") as HTMLSelectElement;
  expect(currency.value).toBe("EUR");

  selectOption(currency, "USD");

  expect(onCurrencyChange).toHaveBeenCalledExactlyOnceWith("USD");
});

it("shows dollars when no currency is offered", () => {
  render(<PriceInput />);

  expect(getByText("$")).toBeTruthy();
  expect(queryByRole("combobox")).toBeNull();
});
