// @vitest-environment jsdom
import { expect, it, vi } from "vitest";

import DetailDrawer from "../../src/components/DetailDrawer";
import {
  click,
  getByRole,
  keyDown,
  queryAllByRole,
  queryByRole,
  render,
} from "../support/render";

const open = (props: { onShare?: () => void } = {}) => {
  const setVisible = vi.fn();
  const book = vi.fn();
  render(
    <DetailDrawer
      buttons={[
        { buttonType: "secondary", label: "Remove", hidden: true, size: "l" },
        { buttonType: "primary", label: "Book", onClick: book, size: "l" },
      ]}
      setVisible={setVisible}
      {...props}
    >
      <h2>Casa Lola, Cartagena</h2>
    </DetailDrawer>
  );
  return { book, setVisible };
};

it.each([
  ["its X", () => click(queryAllByRole("button", "")[0] as HTMLElement)],
  ["the dimmed page", () => click(getByRole("button", "Close"))],
  [
    "Enter on the dimmed page",
    () => keyDown(getByRole("button", "Close"), "Enter"),
  ],
  [
    "Space on the dimmed page",
    () => keyDown(getByRole("button", "Close"), " "),
  ],
])("closes from %s", (_case, close) => {
  const { setVisible } = open();

  close();

  expect(setVisible).toHaveBeenCalledExactlyOnceWith(false);
});

it("shows its actions except the hidden ones", () => {
  const { book } = open();

  click(getByRole("button", "Book"));

  expect(book).toHaveBeenCalledOnce();
  expect(queryByRole("button", "Remove")).toBeNull();
});

it("offers sharing only when its host can share", () => {
  open();
  expect(queryByRole("button", "Share")).toBeNull();
});

it("reports a tap on Share", () => {
  const onShare = vi.fn();
  open({ onShare });

  click(getByRole("button", "Share"));

  expect(onShare).toHaveBeenCalledOnce();
});
