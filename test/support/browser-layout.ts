/**
 * An observer that keeps track of what it watches and never reports: jsdom
 * lays nothing out, so nothing ever resizes.
 */
export class InertResizeObserver {
  readonly #watched = new Set<Element>();

  disconnect() {
    this.#watched.clear();
  }

  observe(target: Element) {
    this.#watched.add(target);
  }

  unobserve(target: Element) {
    this.#watched.delete(target);
  }
}

// jsdom has no layout engine. Tests that exercise a viewport change can
// replace matchMedia with the media-query list they control.
if (typeof window !== "undefined") {
  window.ResizeObserver ??= InertResizeObserver;
  window.matchMedia ??= (media) => ({
    media,
    matches: false,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => true,
  });
}
