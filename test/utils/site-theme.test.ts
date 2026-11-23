// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vite-plus/test";

import {
  applyCssVars,
  readInlineJson,
  setFavicon,
  setFontStylesheet,
  setMetaContent,
} from "../../src/utils/site-theme";

const LORA =
  "https://fonts.googleapis.com/css2?family=Lora:wght@400;700&display=swap";
const DM_SANS =
  "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=swap";
const FAVICON = "https://media.dev.nicer.travel/companies/itk/favicon.png";

const rootStyle = () => document.body.style;

/** A tag already in the head, the way the page renderer or index.html wrote it. */
const inHead = <T extends HTMLElement>(tag: T): T => {
  document.head.append(tag);
  return tag;
};

const link = (rel: string, href: string, id = "") =>
  Object.assign(document.createElement("link"), { href, id, rel });

const stylesheets = () =>
  [
    ...document.head.querySelectorAll<HTMLLinkElement>(
      "link[rel='stylesheet']"
    ),
  ].map((element) => [element.id, element.getAttribute("href")]);

const icons = () =>
  [...document.head.querySelectorAll<HTMLLinkElement>("link[rel='icon']")].map(
    (element) => element.getAttribute("href")
  );

const metaContents = (name: string) =>
  [
    ...document.head.querySelectorAll<HTMLMetaElement>(`meta[name='${name}']`),
  ].map((element) => element.content);

/** The JSON block the page renderer inlines. */
const inlineJson = (id: string, text: string) =>
  inHead(
    Object.assign(document.createElement("script"), {
      id,
      textContent: text,
      type: "application/json",
    })
  );

afterEach(() => {
  document.head.replaceChildren();
  document.body.removeAttribute("style");
});

describe("applyCssVars", () => {
  it("sets the theme's variables on the body, where dark mode's tokens are", () => {
    applyCssVars({ "--brandBg": "#2563eb", "--fontBody": "'Lora', serif" });

    expect(rootStyle().getPropertyValue("--brandBg")).toBe("#2563eb");
    expect(rootStyle().getPropertyValue("--fontBody")).toBe("'Lora', serif");
  });

  it("clears a managed variable the next theme no longer sets, and replaces the others", () => {
    const managed = ["--brandBg", "--highlight"];
    applyCssVars({ "--brandBg": "#2563eb", "--highlight": "#0d9488" }, managed);

    applyCssVars({ "--brandBg": "#7c3aed" }, managed);

    expect(rootStyle().getPropertyValue("--brandBg")).toBe("#7c3aed");
    expect(rootStyle().getPropertyValue("--highlight")).toBe("");
  });

  it("leaves the variables it does not manage alone", () => {
    rootStyle().setProperty("--sidebarWidth", "280px");

    applyCssVars({}, ["--brandBg"]);

    expect(rootStyle().getPropertyValue("--sidebarWidth")).toBe("280px");
  });

  it("themes the element it is given instead of the whole page", () => {
    const preview = document.createElement("div");

    applyCssVars({ "--brandBg": "#2563eb" }, [], preview);

    expect(preview.style.getPropertyValue("--brandBg")).toBe("#2563eb");
    expect(rootStyle().getPropertyValue("--brandBg")).toBe("");
  });
});

describe("setFontStylesheet", () => {
  it("adds one font stylesheet and switches it in place", () => {
    setFontStylesheet(LORA);
    setFontStylesheet(DM_SANS);

    expect(stylesheets()).toStrictEqual([["site-font", DM_SANS]]);
  });

  it("takes over the font stylesheet the page renderer wrote", () => {
    inHead(link("stylesheet", LORA, "site-font"));

    setFontStylesheet(DM_SANS);

    expect(stylesheets()).toStrictEqual([["site-font", DM_SANS]]);
  });

  it("removes the font stylesheet for a theme that keeps the app's fonts", () => {
    setFontStylesheet(LORA);

    setFontStylesheet(null);

    expect(stylesheets()).toStrictEqual([]);
  });
});

describe("setFavicon", () => {
  it("adds the agency's favicon to a page without one", () => {
    setFavicon(FAVICON);

    expect(icons()).toStrictEqual([FAVICON]);
  });

  it("swaps the page's favicon in place instead of adding another", () => {
    inHead(link("icon", "/favicon.ico"));

    setFavicon(FAVICON);

    expect(icons()).toStrictEqual([FAVICON]);
  });
});

describe("setMetaContent", () => {
  it("adds a meta tag the page lacks", () => {
    setMetaContent("theme-color", "#2563eb");

    expect(metaContents("theme-color")).toStrictEqual(["#2563eb"]);
  });

  it("updates the meta tag the page has instead of adding another", () => {
    inHead(
      Object.assign(document.createElement("meta"), {
        content: "#ffffff",
        name: "theme-color",
      })
    );

    setMetaContent("theme-color", "#2563eb");

    expect(metaContents("theme-color")).toStrictEqual(["#2563eb"]);
  });
});

describe("readInlineJson", () => {
  it("reads the site the page renderer inlined, escaped markup included", () => {
    inlineJson(
      "nicer-site",
      '{"company":{"displayName":"ITK \\u003C/script>"},"host":"itk.dev.nicer.travel"}'
    );

    expect(readInlineJson("nicer-site")).toStrictEqual({
      company: { displayName: "ITK </script>" },
      host: "itk.dev.nicer.travel",
    });
  });

  it("reads nothing on a page the renderer did not serve", () => {
    expect(readInlineJson("nicer-site")).toBeUndefined();
  });

  it.each([
    ["an empty block", ""],
    ["a block that is not JSON", "{not json"],
  ])("reads nothing from %s", (_, text) => {
    inlineJson("nicer-site", text);

    expect(readInlineJson("nicer-site")).toBeUndefined();
  });
});
