import { useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";

/** How long what makes room takes to slide, and an item put in to fade in. */
const SLIDE_MS = 300;

/** The app's easing, `--easeOutExpo`. */
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

const still = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Where each of the container's items shows, from its start edge. */
const placesIn = (
  container: HTMLElement,
  axis: "x" | "y"
): Map<string, number> => {
  const box = container.getBoundingClientRect();
  const edge = axis === "x" ? box.left : box.top;
  const at = new Map<string, number>();
  for (const item of container.querySelectorAll<HTMLElement>(
    ":scope > [data-flip]"
  )) {
    const place = item.getBoundingClientRect();
    at.set(
      item.dataset.flip ?? "",
      (axis === "x" ? place.left : place.top) - edge
    );
  }
  return at;
};

/**
 * When the container's items change (`keys`: one taken out, put in, or
 * reordered), slides each that stayed from where it showed to where it
 * is: down a column (`y`) or across a board (`x`). Where they showed is
 * read as the render starts, while the page still shows them: an item
 * that left by its own motion, or a scroll the browser kept in place,
 * moves nothing. The items are the container's children with `data-flip`,
 * the key that names the same item from one render to the next. With
 * `enter`, an item put in fades in where it lands (not the first ones the
 * container shows).
 */
export function useFlip(
  ref: RefObject<HTMLElement | null>,
  keys: string[],
  axis: "x" | "y" = "y",
  { enter = false }: { enter?: boolean } = {}
) {
  const order = keys.join("|");
  const shown = useRef(order);
  const before = useRef<Map<string, number> | null>(null);
  const slides = useRef<Animation[]>([]);
  // Read in render, before the page changes: the last state it showed.
  if (order !== shown.current && ref.current) {
    before.current = placesIn(ref.current, axis);
  }

  useLayoutEffect(() => {
    const container = ref.current;
    const from = before.current;
    before.current = null;
    if (order === shown.current) {
      return;
    }
    // The items it showed first come as they are.
    const hadItems = shown.current !== "";
    shown.current = order;
    if (!(container && from) || still()) {
      return;
    }
    for (const slide of slides.current) {
      slide.cancel();
    }
    slides.current = [];
    const to = placesIn(container, axis);
    for (const item of container.querySelectorAll<HTMLElement>(
      ":scope > [data-flip]"
    )) {
      const key = item.dataset.flip ?? "";
      const was = from.get(key);
      if (was === undefined && enter && hadItems) {
        slides.current.push(
          item.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: SLIDE_MS,
            easing: EASE_OUT,
          })
        );
        continue;
      }
      const shift = was === undefined ? 0 : was - (to.get(key) ?? was);
      if (Math.abs(shift) >= 1) {
        const move = axis === "x" ? "translateX" : "translateY";
        slides.current.push(
          item.animate(
            [{ transform: `${move}(${shift}px)` }, { transform: "none" }],
            { duration: SLIDE_MS, easing: EASE_OUT }
          )
        );
      }
    }
    // A container that snaps to its items would chase them as they slide,
    // undoing it: it snaps again once they are in place.
    const running = slides.current;
    if (running.length === 0) {
      container.style.scrollSnapType = "";
      return;
    }
    container.style.scrollSnapType = "none";
    void Promise.allSettled(running.map((slide) => slide.finished)).then(() => {
      if (slides.current === running) {
        container.style.scrollSnapType = "";
      }
    });
  }, [order]);
}
