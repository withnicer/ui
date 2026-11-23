// @vitest-environment jsdom
import { expect, it, vi } from "vite-plus/test";

import Dialog from "../../src/components/Dialog";
import {
  click,
  getByRole,
  getByText,
  queryAllByRole,
  render,
} from "../support/render";

const confirmRemoval = () => {
  const setVisible = vi.fn();
  const remove = vi.fn();
  render(
    <Dialog
      actions={[
        { hierarchy: "secondary", label: "Keep", onClick: vi.fn() },
        { hierarchy: "destructive", label: "Remove", onClick: remove },
        {
          disabled: true,
          hierarchy: "primary",
          label: "Archive",
          onClick: vi.fn(),
        },
      ]}
      description="The traveler loses access to the trip."
      setVisible={setVisible}
      title="Remove traveler?"
    />
  );
  return { remove, setVisible };
};

it("asks its question with its actions", () => {
  const { remove } = confirmRemoval();

  click(getByRole("button", "Remove"));

  expect(getByText("Remove traveler?")).toBeTruthy();
  expect(getByText("The traveler loses access to the trip.")).toBeTruthy();
  expect(remove).toHaveBeenCalledOnce();
  expect((getByRole("button", "Archive") as HTMLButtonElement).disabled).toBe(
    true
  );
});

it.each([
  ["its X", () => click(queryAllByRole("button", "")[0] as HTMLElement)],
  [
    "the dimmed page",
    () =>
      click(
        getByText("Remove traveler?").closest("div")
          ?.previousElementSibling as Element
      ),
  ],
])("closes from %s", (_case, close) => {
  const { setVisible } = confirmRemoval();

  close();

  expect(setVisible).toHaveBeenCalledExactlyOnceWith(false);
});
