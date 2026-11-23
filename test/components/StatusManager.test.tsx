// @vitest-environment jsdom
import { useContext } from "react";
import { expect, it } from "vite-plus/test";

import StatusManager from "../../src/components/StatusManager";
import StatusContext from "../../src/contexts/StatusContext";
import {
  click,
  getByRole,
  queryAllByRole,
  queryAllByText,
  render,
} from "../support/render";

/** A screen that reports the outcome of saving, as the apps do. */
function SaveButton() {
  const setStatus = useContext(StatusContext);
  return (
    <button
      onClick={() => setStatus({ description: "Trip saved", type: "success" })}
      type="button"
    >
      Save
    </button>
  );
}

it("shows the status a screen raises, and can show it again once closed", () => {
  render(
    <StatusManager>
      <SaveButton />
    </StatusManager>
  );
  expect(queryAllByText("Trip saved")).toEqual([]);

  click(getByRole("button", "Save"));
  expect(queryAllByText("Trip saved")).toHaveLength(1);

  // The toast's X: the only button without a name.
  click(queryAllByRole("button", "")[0] as HTMLElement);
  expect(queryAllByText("Trip saved")).toEqual([]);

  click(getByRole("button", "Save"));
  expect(queryAllByText("Trip saved")).toHaveLength(1);
});
