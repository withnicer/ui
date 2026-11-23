// @vitest-environment jsdom
import { act } from "react";
import { afterEach, expect, it, vi } from "vite-plus/test";

import PhoneInput from "../../src/components/PhoneInput";
import {
  change,
  click,
  getByPlaceholderText,
  getByRole,
  getByText,
  render,
} from "../support/render";

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * The visitor's location, as ipinfo.io answers it, when the test says so:
 * the field asks for it on mount to preselect the country's dial code.
 */
function locateVisitor() {
  let answer: (location: unknown) => Promise<void> = async () => {};
  let fail: () => Promise<void> = async () => {};
  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise((resolve, reject) => {
          answer = (location) =>
            act(async () => {
              resolve({ json: async () => location });
            });
          fail = () =>
            act(async () => {
              reject(new TypeError("Failed to fetch"));
            });
        })
    )
  );
  return {
    answer: (location: unknown) => answer(location),
    fail: () => fail(),
  };
}

const dialCode = () => getByRole("button", /^\+\d+$/).textContent;
const phone = () => getByPlaceholderText("Phone");

it.each([
  ["a city in Colombia", "+57", { city: "Bogotá", country: "CO" }],
  ["a country but no city", "+1", { country: "CO" }],
  ["a country without a dial code", "+1", { city: "Nowhere", country: "XX" }],
])("starts a visitor located in %s on %s", async (_case, code, location) => {
  const visitor = locateVisitor();
  render(<PhoneInput />);

  await visitor.answer(location);

  expect(dialCode()).toBe(code);
});

it("keeps +1 when the location cannot be looked up", async () => {
  const visitor = locateVisitor();
  render(<PhoneInput />);

  await visitor.fail();

  expect(dialCode()).toBe("+1");
});

it("keeps the dial code of a number typed before the location arrived", async () => {
  const visitor = locateVisitor();
  render(<PhoneInput />);

  change(phone(), "3055550100");
  await visitor.answer({ city: "Bogotá", country: "CO" });

  expect(dialCode()).toBe("+1");
});

it("keeps the dial code picked before the location arrived", async () => {
  const visitor = locateVisitor();
  render(<PhoneInput />);

  click(getByRole("button", "+1"));
  click(getByText("🇲🇽 Mexico (+52)"));
  await visitor.answer({ city: "Bogotá", country: "CO" });

  expect(dialCode()).toBe("+52");
});

it("reports the complete number again when another dial code is picked", () => {
  locateVisitor();
  const onChange = vi.fn();
  render(<PhoneInput onChange={onChange} />);

  change(phone(), "3059990000");
  click(getByRole("button", "+1"));
  click(getByText("🇲🇽 Mexico (+52)"));

  expect(onChange).toHaveBeenLastCalledWith({
    completeNumber: "+523059990000",
    dialCode: "+52",
    number: "3059990000",
  });
});

it("keeps only the digits typed and reports the complete number", () => {
  locateVisitor();
  const onChange = vi.fn();
  render(<PhoneInput onChange={onChange} />);

  change(phone(), "(305) 555-0100");

  expect(phone().value).toBe("3055550100");
  expect(onChange).toHaveBeenLastCalledWith({
    completeNumber: "+13055550100",
    dialCode: "+1",
    number: "3055550100",
  });
});
