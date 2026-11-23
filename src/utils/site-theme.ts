/**
 * Browser glue for a booking-site theme. The theme itself (which variables,
 * which values) is computed by `siteThemeVars` in `@nicer/catalog`; this module
 * only writes it into the document, so `@nicer/ui` stays free of contracts.
 */

type StyleTarget = {
  style: {
    setProperty: (name: string, value: string) => void;
    removeProperty: (name: string) => string;
  };
};

/**
 * Sets `vars` on `target` (the body by default) and clears every name in
 * `managed` that this theme no longer sets, so switching themes never leaves
 * a stale color behind. The body, not the root: dark mode redefines the same
 * tokens on `body.dark`, which hid every color set on <html> but the brand's.
 */
export const applyCssVars = (
  vars: Record<string, string>,
  managed: readonly string[] = [],
  target: StyleTarget = document.body
): void => {
  for (const name of managed) {
    if (!(name in vars)) {
      target.style.removeProperty(name);
    }
  }
  for (const [name, value] of Object.entries(vars)) {
    target.style.setProperty(name, value);
  }
};

const upsertHeadElement = <T extends HTMLElement>(
  selector: string,
  create: () => T
): T => {
  const existing = document.head.querySelector<T>(selector);
  if (existing) {
    return existing;
  }
  const element = create();
  document.head.append(element);
  return element;
};

/** One `<link id="site-font">`; `null` removes it. */
export const setFontStylesheet = (href: string | null): void => {
  const current = document.getElementById("site-font");
  if (!href) {
    current?.remove();
    return;
  }
  const link = upsertHeadElement<HTMLLinkElement>("#site-font", () => {
    const element = document.createElement("link");
    element.id = "site-font";
    element.rel = "stylesheet";
    return element;
  });
  if (link.href !== href) {
    link.href = href;
  }
};

export const setFavicon = (href: string): void => {
  const link = upsertHeadElement<HTMLLinkElement>("link[rel='icon']", () => {
    const element = document.createElement("link");
    element.rel = "icon";
    return element;
  });
  link.href = href;
};

/** `<meta name=…>`; created when missing. */
export const setMetaContent = (name: string, content: string): void => {
  const meta = upsertHeadElement<HTMLMetaElement>(
    `meta[name='${name}']`,
    () => {
      const element = document.createElement("meta");
      element.name = name;
      return element;
    }
  );
  meta.content = content;
};

/**
 * The JSON the page renderer inlines as `<script type="application/json"
 * id="nicer-site">`. `undefined` when the page was not served by the renderer.
 */
export const readInlineJson = <T>(id: string): T | undefined => {
  const element = document.getElementById(id);
  if (!element?.textContent) {
    return undefined;
  }
  try {
    return JSON.parse(element.textContent) as T;
  } catch {
    return undefined;
  }
};
