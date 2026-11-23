// @vitest-environment jsdom
import { expect, it, vi } from "vitest";

import Toggle from "../../src/components/Toggle";
import { click, getByRole, queryAllByRole, render } from "../support/render";

const views = () => [
  { label: "List", onClick: vi.fn() },
  { label: "Map", onClick: vi.fn() },
];

/** The option shown as picked. */
const picked = () =>
  queryAllByRole("button")
    .filter((option) => option.className === "active")
    .map((option) => option.textContent);

it("marks the option picked and runs it", () => {
  const options = views();
  render(<Toggle options={options} />);
  expect(picked()).toEqual(["List"]);

  click(getByRole("button", "Map"));

  expect(picked()).toEqual(["Map"]);
  expect(options[1]?.onClick).toHaveBeenCalledOnce();
});

it("follows the option its host picks", () => {
  const options = views();
  const { rerender } = render(<Toggle defaultSelected={1} options={options} />);
  expect(picked()).toEqual(["Map"]);

  rerender(<Toggle defaultSelected={0} options={options} />);

  expect(picked()).toEqual(["List"]);
});

it("picks nothing for a negative index", () => {
  render(<Toggle defaultSelected={-1} options={views()} />);

  expect(picked()).toEqual([]);
});
