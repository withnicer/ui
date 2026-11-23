// @vitest-environment jsdom
import { expect, it, vi } from "vitest";

import Tabs from "../../src/components/Tabs";
import {
  click,
  getByRole,
  getByText,
  keyDown,
  queryAllByRole,
  render,
} from "../support/render";

const tabs = () => [
  { label: "Upcoming", onClick: vi.fn() },
  { label: "Pending", onClick: vi.fn() },
  { label: "Past", onClick: vi.fn() },
];

/** The tab shown as the current one. */
const current = () =>
  queryAllByRole("button")
    .filter((tab) => tab.classList.contains("active"))
    .map((tab) => tab.textContent);

it("starts on the first tab", () => {
  render(<Tabs tabs={tabs()} />);

  expect(current()).toEqual(["Upcoming"]);
});

it.each([
  ["a click", (tab: HTMLElement) => click(tab)],
  ["Enter", (tab: HTMLElement) => keyDown(tab, "Enter")],
  ["Space", (tab: HTMLElement) => keyDown(tab, " ")],
])("switches to the tab picked with %s", (_case, pick) => {
  const list = tabs();
  render(<Tabs tabs={list} />);

  pick(getByRole("button", "Pending"));

  expect(current()).toEqual(["Pending"]);
  expect(list[1]?.onClick).toHaveBeenCalledOnce();
});

it("follows the tab its parent selects", () => {
  const list = tabs();
  const { rerender } = render(<Tabs activeIndex={1} tabs={list} />);
  expect(current()).toEqual(["Pending"]);

  rerender(<Tabs activeIndex={2} tabs={list} />);

  expect(current()).toEqual(["Past"]);
});

it("shows a count after the label, zero included", () => {
  render(
    <Tabs
      tabs={[
        { count: 3, label: "Queue", onClick: vi.fn() },
        { count: 0, label: "Failed", onClick: vi.fn() },
        { label: "All", onClick: vi.fn() },
      ]}
    />
  );

  expect(getByText("3").parentElement?.firstChild?.textContent).toBe("Queue");
  expect(getByText("0").parentElement?.firstChild?.textContent).toBe("Failed");
  expect(getByRole("button", "All").textContent).toBe("All");
});
