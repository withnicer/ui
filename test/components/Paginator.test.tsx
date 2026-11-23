// @vitest-environment jsdom
import { expect, it, vi } from "vite-plus/test";

import Paginator from "../../src/components/Paginator";
import {
  click,
  getByRole,
  getByText,
  queryAllByRole,
  render,
  selectOption,
} from "../support/render";

const page = (currentPage: number) => {
  const handlers = {
    onNextPage: vi.fn(),
    onPageChange: vi.fn(),
    onPrevPage: vi.fn(),
  };
  render(
    <Paginator
      currentPage={currentPage}
      resultsPerPage={10}
      totalPages={3}
      totalResults={25}
      {...handlers}
    />
  );
  return handlers;
};

/** The back and forward arrows: the only buttons without a name. */
const arrows = () => {
  const [back, forward] = queryAllByRole("button", "") as HTMLButtonElement[];
  return { back, forward };
};

it.each([
  [1, "1-10 of 25"],
  [3, "21-25 of 25"],
])("counts the results on page %i as %s", (current, range) => {
  page(current);

  expect(getByText(range)).toBeTruthy();
});

it("counts an empty list as nothing, not as a first result", () => {
  render(
    <Paginator
      currentPage={1}
      onNextPage={vi.fn()}
      onPageChange={vi.fn()}
      onPrevPage={vi.fn()}
      resultsPerPage={10}
      totalPages={1}
      totalResults={0}
    />
  );

  expect(getByText("0-0 of 0")).toBeTruthy();
});

it.each([
  [1, [true, false]],
  [2, [false, false]],
  [3, [false, true]],
])("lets page %i go back and forward: disabled %j", (current, disabled) => {
  page(current);

  expect([arrows().back?.disabled, arrows().forward?.disabled]).toEqual(
    disabled
  );
});

it("turns the page with the arrows", () => {
  const { onNextPage, onPrevPage } = page(2);

  click(arrows().back as HTMLButtonElement);
  click(arrows().forward as HTMLButtonElement);

  expect(onPrevPage).toHaveBeenCalledOnce();
  expect(onNextPage).toHaveBeenCalledOnce();
});

it("jumps to the page picked", () => {
  const { onPageChange } = page(1);

  selectOption(getByRole("combobox") as HTMLSelectElement, "3");

  expect(onPageChange).toHaveBeenCalledExactlyOnceWith(3);
});
