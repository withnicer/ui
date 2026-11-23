// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

import { installImageFallbacks } from "../../src/utils/image-fallbacks";

let uninstall: () => void;

beforeEach(() => {
  uninstall = installImageFallbacks();
});

afterEach(() => {
  uninstall();
  document.body.replaceChildren();
});

/** No natural size: what an SVG without a size of its own decodes to. */
const UNSIZED = { height: 0, width: 0 };

/** An attached image with the natural size the browser decoded (jsdom decodes none). */
const image = (
  src: string,
  natural: { height: number; width: number } = UNSIZED
): HTMLImageElement => {
  const element = document.createElement("img");
  element.src = src;
  element.alt = "The Moore Miami";
  Object.defineProperty(element, "naturalWidth", { get: () => natural.width });
  Object.defineProperty(element, "naturalHeight", {
    get: () => natural.height,
  });
  document.body.append(element);
  return element;
};

const shown = (element: HTMLImageElement) =>
  element.hasAttribute("data-image-fallback");

/** Which placeholder the image shows, if any. */
const placeholderOf = (element: HTMLImageElement) =>
  element.getAttribute("data-image-fallback");

/** Puts the image in a frame, the way components wrap their photos. */
const framed = (element: HTMLImageElement, frame: HTMLElement) => {
  frame.append(element);
  document.body.append(frame);
  return element;
};

describe("installImageFallbacks", () => {
  it("shows the placeholder for an image that failed, without its srcset", () => {
    const photo = image("https://img.example/expired.jpg");
    photo.srcset = "https://img.example/expired-2x.jpg 2x";

    photo.dispatchEvent(new Event("error"));

    expect(placeholderOf(photo)).toBe("photo");
    expect(photo.src.startsWith("data:image/gif")).toBe(true);
    expect(photo.hasAttribute("srcset")).toBe(false);
  });

  it("shows the placeholder for the media proxy's 1×1 pixel", () => {
    const cover = image("https://media.dev.nicer.travel/places/expired", {
      height: 1,
      width: 1,
    });

    cover.dispatchEvent(new Event("load"));

    expect(shown(cover)).toBe(true);
  });

  it("keeps a real photo, and an SVG without a size of its own", () => {
    const photo = image("https://img.example/hotel.jpg", {
      height: 800,
      width: 1200,
    });
    const logo = image("/images/layout/footer-logo.svg");

    photo.dispatchEvent(new Event("load"));
    logo.dispatchEvent(new Event("load"));

    expect(shown(photo)).toBe(false);
    expect(photo.src).toBe("https://img.example/hotel.jpg");
    expect(shown(logo)).toBe(false);
  });

  it("leaves the placeholder alone when its own pixel loads, so it never loops", () => {
    // The transparent GIF is 1×1 too: reassigning its src would load it again.
    const photo = image("https://img.example/expired.jpg", {
      height: 1,
      width: 1,
    });
    photo.dispatchEvent(new Event("error"));
    const changes = new MutationObserver(() => undefined);
    changes.observe(photo, { attributes: true });

    photo.dispatchEvent(new Event("load"));

    expect(changes.takeRecords()).toHaveLength(0);
    expect(shown(photo)).toBe(true);
    changes.disconnect();
  });

  it("marks a real photo loaded, and never the proxy's pixel", () => {
    const photo = image("https://img.example/hotel.jpg", {
      height: 800,
      width: 1200,
    });
    const cover = image("https://media.dev.nicer.travel/places/expired", {
      height: 1,
      width: 1,
    });

    photo.dispatchEvent(new Event("load"));
    cover.dispatchEvent(new Event("load"));

    expect(photo.hasAttribute("data-image-loaded")).toBe(true);
    expect(cover.hasAttribute("data-image-loaded")).toBe(false);
  });

  it("drops the placeholder once the same element loads a real photo", () => {
    const natural = { ...UNSIZED };
    const photo = image("https://img.example/expired.jpg", natural);
    photo.dispatchEvent(new Event("error"));

    photo.src = "https://img.example/hotel.jpg";
    natural.height = 800;
    natural.width = 1200;
    photo.dispatchEvent(new Event("load"));

    expect(shown(photo)).toBe(false);
  });

  it("shows a person for an image drawn round, or clipped by a round frame", () => {
    const own = image("https://img.example/expired-avatar.jpg");
    // The longhand: jsdom doesn't expand `border-radius`, browsers always do.
    own.style.borderTopLeftRadius = "50%";
    const frame = document.createElement("span");
    frame.style.borderTopLeftRadius = "50%";
    const clipped = framed(image("https://img.example/expired.jpg"), frame);

    own.dispatchEvent(new Event("error"));
    clipped.dispatchEvent(new Event("error"));

    expect(placeholderOf(own)).toBe("avatar");
    expect(placeholderOf(clipped)).toBe("avatar");
  });

  it("shows a hotel's room for a photo marked as one, or held by a hotel", () => {
    const room = image("https://img.example/expired-room.jpg");
    room.dataset.imageKind = "lodging";
    const banner = document.createElement("div");
    banner.dataset.imageKind = "lodging";
    const slide = framed(image("https://img.example/expired.jpg"), banner);

    room.dispatchEvent(new Event("error"));
    slide.dispatchEvent(new Event("error"));

    expect(placeholderOf(room)).toBe("lodging");
    expect(placeholderOf(slide)).toBe("lodging");
  });

  it("keeps an avatar a person inside a hotel's frame", () => {
    const banner = document.createElement("div");
    banner.dataset.imageKind = "lodging";
    const advisor = framed(image("https://img.example/expired.jpg"), banner);
    advisor.style.borderTopLeftRadius = "50%";

    advisor.dispatchEvent(new Event("error"));

    expect(placeholderOf(advisor)).toBe("avatar");
  });
});
