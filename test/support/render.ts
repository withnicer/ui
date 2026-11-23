import { act, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { onTestFinished } from "vitest";

// Without it React warns that every update in a test is outside act().
Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

/**
 * Mounts `ui` in its own container on `document.body` and unmounts it when
 * the test finishes. packages/ui has no Testing Library, so the queries below
 * stand in for it: they find what a user finds (a role and its name, visible
 * text, a placeholder), anywhere on the page, portals included.
 */
export function render(ui: ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() => root.render(ui));
  let mounted = true;
  const unmount = () => {
    if (mounted) {
      mounted = false;
      act(() => root.unmount());
      container.remove();
    }
  };
  onTestFinished(unmount);
  return {
    rerender: (next: ReactElement) => act(() => root.render(next)),
    unmount,
  };
}

const ROLES: Record<string, string> = {
  button: "button, [role='button']",
  combobox: "select:not([multiple]), [role='combobox']",
  slider: "input[type='range'], [role='slider']",
  textbox:
    "input:not([type]), input[type='text'], input[type='tel'], textarea, [role='textbox']",
  tooltip: "[role='tooltip']",
};

const normalize = (text: string | null | undefined) =>
  (text ?? "").replace(/\s+/g, " ").trim();

const matches = (text: string, expected: string | RegExp) =>
  typeof expected === "string" ? text === expected : expected.test(text);

/** What a screen reader announces: its aria-label, else its text. */
export const accessibleName = (element: Element): string =>
  normalize(element.getAttribute("aria-label") ?? element.textContent);

/** Every element of `role` on the page, optionally with that accessible name. */
export function queryAllByRole(
  role: keyof typeof ROLES,
  name?: string | RegExp
): HTMLElement[] {
  return [...document.body.querySelectorAll<HTMLElement>(ROLES[role])].filter(
    (element) => name === undefined || matches(accessibleName(element), name)
  );
}

export function queryByRole(
  role: keyof typeof ROLES,
  name?: string | RegExp
): HTMLElement | null {
  const found = queryAllByRole(role, name);
  if (found.length > 1) {
    throw new Error(`${found.length} ${role} elements named ${String(name)}`);
  }
  return found[0] ?? null;
}

export function getByRole(
  role: keyof typeof ROLES,
  name?: string | RegExp
): HTMLElement {
  const found = queryByRole(role, name);
  if (!found) {
    throw new Error(`No ${role} named ${String(name)}`);
  }
  return found;
}

/** The innermost elements whose whole text is `text`. */
export function queryAllByText(text: string | RegExp): HTMLElement[] {
  return [...document.body.querySelectorAll<HTMLElement>("*")].filter(
    (element) =>
      matches(normalize(element.textContent), text) &&
      ![...element.children].some((child) =>
        matches(normalize(child.textContent), text)
      )
  );
}

export function getByText(text: string | RegExp): HTMLElement {
  const [found, ...more] = queryAllByText(text);
  if (!found || more.length > 0) {
    throw new Error(`${more.length + (found ? 1 : 0)} elements read ${text}`);
  }
  return found;
}

export function getByPlaceholderText(text: string): HTMLInputElement {
  const found = document.body.querySelector<HTMLInputElement>(
    `[placeholder="${text}"]`
  );
  if (!found) {
    throw new Error(`No field with placeholder ${text}`);
  }
  return found;
}

export const click = (element: Element) =>
  act(() => {
    (element as HTMLElement).click();
  });

/** Sets a field's value the way typing does, so React's onChange fires. */
export function change(input: HTMLInputElement, value: string) {
  const setValue = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;
  act(() => {
    setValue?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

/** Picks an option of a native select, as the browser does. */
export const selectOption = (select: HTMLSelectElement, value: string) =>
  act(() => {
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });

export const keyDown = (element: Element, key: string) =>
  act(() => {
    element.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key })
    );
  });

/** The pointer moving onto, then off, an element (React's mouseenter/leave). */
export const hover = (element: Element) =>
  act(() => {
    element.dispatchEvent(
      new MouseEvent("mouseover", {
        bubbles: true,
        relatedTarget: document.body,
      })
    );
  });

export const unhover = (element: Element) =>
  act(() => {
    element.dispatchEvent(
      new MouseEvent("mouseout", {
        bubbles: true,
        relatedTarget: document.body,
      })
    );
  });
