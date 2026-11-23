// @vitest-environment jsdom
import { act } from "react";
import { expect, it, vi } from "vite-plus/test";

import FileInput from "../../src/components/FileInput";
import { getByText, queryAllByText, render } from "../support/render";

const passport = new File(["%PDF"], "passport.pdf", {
  type: "application/pdf",
});
const visa = new File(["PNG"], "visa.png", { type: "image/png" });

const picker = () =>
  document.body.querySelector("input[type='file']") as HTMLInputElement;

/** What the browser hands over when files are picked in its dialog. */
const pick = (files: File[]) =>
  act(() => {
    Object.defineProperty(picker(), "files", {
      configurable: true,
      value: files,
    });
    picker().dispatchEvent(new Event("change", { bubbles: true }));
  });

/** Files dropped on the box. */
const drop = (files: File[]) =>
  act(() => {
    const event = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", { value: { files } });
    picker().parentElement?.dispatchEvent(event);
  });

it.each([
  [false, "Select or drag your file"],
  [true, "Select or drag your files"],
])("asks for files, several: %s", (multiple, prompt) => {
  render(<FileInput label="PDF or image, 10 MB at most" multiple={multiple} />);

  expect(getByText(prompt)).toBeTruthy();
  expect(getByText("PDF or image, 10 MB at most")).toBeTruthy();
});

it("names the files picked and passes the pick on", () => {
  const onChange = vi.fn();
  render(<FileInput multiple onChange={onChange} />);

  pick([passport, visa]);

  expect(getByText("passport.pdf, visa.png")).toBeTruthy();
  expect(onChange).toHaveBeenCalledOnce();
});

it("takes the files dropped on it", () => {
  const onChange = vi.fn();
  render(<FileInput onChange={onChange} />);

  drop([passport]);

  expect(getByText("passport.pdf")).toBeTruthy();
  expect(onChange.mock.lastCall?.[0].target.files).toEqual([passport]);
});

it("shows the files its host already holds", () => {
  const { rerender } = render(<FileInput inputValue={passport} />);
  expect(getByText("passport.pdf")).toBeTruthy();

  rerender(<FileInput inputValue={[passport, visa]} />);

  expect(getByText("passport.pdf, visa.png")).toBeTruthy();
  expect(queryAllByText(/Select or drag/)).toEqual([]);
});
