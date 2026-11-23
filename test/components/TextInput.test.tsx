// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

import TextInput from "../../src/components/TextInput";

let container: HTMLDivElement;
let root: Root;

const render = async (element: React.ReactElement) => {
  await act(async () => {
    root.render(element);
  });
};

/** The field a `<label>` names, as `getByLabelText` and screen readers find it. */
const fieldOf = (text: string) => {
  const label = [...container.querySelectorAll("label")].find(
    (element) => element.textContent === text
  );
  return label?.htmlFor ? document.getElementById(label.htmlFor) : null;
};

describe("TextInput", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("names its field with its label", async () => {
    await render(<TextInput label="Site address" readOnly value="acme" />);

    expect(fieldOf("Site address")).toBe(container.querySelector("input"));
  });

  it("keeps the id the page gives it, so the page's own label works too", async () => {
    await render(<TextInput id="handle" label="Handle" />);

    expect(container.querySelector("input")?.id).toBe("handle");
    expect(fieldOf("Handle")?.id).toBe("handle");
  });

  it("gives two fields on one page labels of their own", async () => {
    await render(
      <>
        <TextInput label="Email" />
        <TextInput label="Phone" />
      </>
    );

    expect(fieldOf("Email")).not.toBe(fieldOf("Phone"));
    expect(fieldOf("Email")).not.toBeNull();
  });
});
