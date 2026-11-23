// @vitest-environment jsdom
import { expect, it, vi } from "vitest";

import Modal from "../../src/components/Modal";
import {
  click,
  getByRole,
  getByText,
  queryAllByRole,
  queryByRole,
  render,
} from "../support/render";

const open = (props: { hideCloseButton?: boolean; visible?: boolean } = {}) => {
  const setVisible = vi.fn();
  const save = vi.fn();
  render(
    <Modal
      button={{
        buttonType: "primary",
        label: "Save",
        onClick: save,
        size: "m",
      }}
      setVisible={setVisible}
      title="Propose a call"
      visible
      {...props}
    >
      <p>Pick a day and a time.</p>
    </Modal>
  );
  return { save, setVisible };
};

/** The page dimmed behind the box. */
const backdrop = () =>
  getByText("Propose a call").closest("div")?.previousElementSibling as Element;

it("shows its title, content and action", () => {
  const { save } = open();

  click(getByRole("button", "Save"));

  expect(getByText("Pick a day and a time.")).toBeTruthy();
  expect(save).toHaveBeenCalledOnce();
});

it.each([
  ["its X", () => click(queryAllByRole("button", "")[0] as HTMLElement)],
  ["the dimmed page", () => click(backdrop())],
])("closes from %s", (_case, close) => {
  const { setVisible } = open();

  close();

  expect(setVisible).toHaveBeenCalledExactlyOnceWith(false);
});

it("stays open without its X, even on a click outside", () => {
  const { setVisible } = open({ hideCloseButton: true });

  click(backdrop());

  expect(queryAllByRole("button", "")).toEqual([]);
  expect(setVisible).not.toHaveBeenCalled();
});

it("shows nothing while it is closed", () => {
  open({ visible: false });

  expect(queryByRole("button", "Save")).toBeNull();
});
