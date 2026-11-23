// @vitest-environment jsdom
import { act } from "react";
import { afterEach, expect, it, vi } from "vite-plus/test";

import Toast from "../../src/components/Toast";
import {
  click,
  queryAllByRole,
  queryAllByText,
  render,
} from "../support/render";

afterEach(() => {
  vi.useRealTimers();
});

it("closes from its X when it does not close itself", () => {
  const setVisible = vi.fn();
  render(
    <Toast
      description="Trip saved"
      setVisible={setVisible}
      type="success"
      visible
    />
  );

  // The X: the only button, and it has no name.
  click(queryAllByRole("button")[0] as HTMLElement);

  expect(setVisible).toHaveBeenCalledExactlyOnceWith(false);
});

it("closes itself after five seconds, with no X to wait on", () => {
  vi.useFakeTimers();
  const setVisible = vi.fn();
  render(
    <Toast
      autoClose
      description="Trip saved"
      setVisible={setVisible}
      type="success"
      visible
    />
  );
  expect(queryAllByRole("button")).toEqual([]);

  act(() => {
    vi.advanceTimersByTime(4999);
  });
  expect(setVisible).not.toHaveBeenCalled();

  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(setVisible).toHaveBeenCalledExactlyOnceWith(false);
});

it("shows nothing while it is closed", () => {
  render(
    <Toast
      description="Trip saved"
      setVisible={vi.fn()}
      type="error"
      visible={false}
    />
  );

  expect(queryAllByText("Trip saved")).toEqual([]);
});
