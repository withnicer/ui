/**
 * Marks an <img> that shows a placeholder, with which one as its value: the
 * global rules in styles.sass paint each.
 */
const FALLBACK_ATTRIBUTE = "data-image-fallback";

/** Marks an <img> that loaded a real photo: `.ui-image-reveal` shows it then. */
const LOADED_ATTRIBUTE = "data-image-loaded";

/**
 * Which placeholder a failed photo shows: a hotel's blurred room, a person's
 * silhouette, or a picture glyph for everything else (trip covers, places).
 */
export type ImageKind = "avatar" | "lodging" | "photo";

/** Set on a hotel's <img> (or around it) so a failed photo shows a room. */
const IMAGE_KIND_ATTRIBUTE = "data-image-kind";

/**
 * A transparent GIF a failed image switches to: it loads, so the browser
 * draws neither its broken-image icon nor the alt text, and the placeholder
 * painted behind it shows through.
 */
const FALLBACK_SRC =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * The media proxy answers a photo it can't serve (expired, deleted, from
 * another environment) with 200 and a 1×1 pixel, so `error` never fires: the
 * size is what gives it away. Exactly 1×1 — an SVG without a size of its own
 * loads as 0×0 and is a real image.
 */
export const isPlaceholderPixel = (image: HTMLImageElement): boolean =>
  image.naturalWidth === 1 && image.naturalHeight === 1;

/** Drawn as a circle — the image itself or the frame that clips it. */
const isRound = (element: Element | null): boolean => {
  if (!element) {
    return false;
  }
  const radius = getComputedStyle(element).borderTopLeftRadius;
  if (radius.endsWith("%")) {
    return Number.parseFloat(radius) >= 50;
  }
  const { height, width } = element.getBoundingClientRect();
  return width > 0 && Number.parseFloat(radius) * 2 >= Math.min(width, height);
};

const isImageKind = (value: string | null | undefined): value is ImageKind =>
  value === "avatar" || value === "lodging" || value === "photo";

/**
 * The image's own kind, else a person's when it's drawn round (every avatar
 * in the apps is, and nothing else is), else the kind of what holds it.
 */
const kindOf = (image: HTMLImageElement): ImageKind => {
  const own = image.getAttribute(IMAGE_KIND_ATTRIBUTE);
  if (isImageKind(own)) {
    return own;
  }
  if (isRound(image) || isRound(image.parentElement)) {
    return "avatar";
  }
  const held = image
    .closest(`[${IMAGE_KIND_ATTRIBUTE}]`)
    ?.getAttribute(IMAGE_KIND_ATTRIBUTE);
  return isImageKind(held) ? held : "photo";
};

/**
 * Whether an <img> gave up on its photo and shows a placeholder — true from
 * inside its own `onError`/`onLoad`, since the document listener runs first.
 */
export const showsImageFallback = (image: HTMLImageElement): boolean =>
  image.hasAttribute(FALLBACK_ATTRIBUTE);

const showFallback = (image: HTMLImageElement): void => {
  image.setAttribute(FALLBACK_ATTRIBUTE, kindOf(image));
  // A srcset would keep picking the failed candidate over the src.
  image.removeAttribute("srcset");
  image.src = FALLBACK_SRC;
};

const onImageEvent = (event: Event): void => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || image.src === FALLBACK_SRC) {
    return;
  }
  if (event.type === "error" || isPlaceholderPixel(image)) {
    showFallback(image);
    return;
  }
  // The same element now shows a real photo (its src changed); one that
  // waits for its pixels (.ui-image-reveal) may now show.
  image.removeAttribute(FALLBACK_ATTRIBUTE);
  image.setAttribute(LOADED_ATTRIBUTE, "");
};

/**
 * Every <img> that fails to load, or loads the media proxy's 1×1 pixel, shows
 * the placeholder instead of a broken icon, its alt text or a solid block.
 * `load` and `error` don't bubble, so one capture listener on the document
 * sees every image; a component's own `onError` still runs after it and wins.
 * Returns the uninstall.
 */
export const installImageFallbacks = (): (() => void) => {
  document.addEventListener("error", onImageEvent, true);
  document.addEventListener("load", onImageEvent, true);
  return () => {
    document.removeEventListener("error", onImageEvent, true);
    document.removeEventListener("load", onImageEvent, true);
  };
};
