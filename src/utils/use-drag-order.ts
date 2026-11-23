import {
  type PointerEvent,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/** How long a dropped row takes to settle in its slot. */
const SETTLE_MS = 200;

/** The app's easing, `--easeOutExpo`. */
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

const still = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The order with one row at another place. */
export const placed = <Id extends string>(
  from: readonly Id[],
  id: Id,
  index: number
): Id[] => {
  const rest = from.filter((each) => each !== id);
  rest.splice(Math.max(0, Math.min(index, rest.length)), 0, id);
  return rest;
};

/**
 * A list's rows dragged into a new order where they stand, as the Columns
 * menu's: the row in hand follows the pointer, the others make room (the
 * list slides them with `useFlip`), and dropped, it settles into its slot
 * and `onMove` takes the new order once. Each row carries `data-row`; the
 * one in hand drops its `data-flip`, so the slides leave it alone. The
 * list's first row starts at the list's top.
 */
export function useDragOrder<Id extends string>(
  listRef: RefObject<HTMLElement | null>,
  settled: readonly Id[],
  onMove: (order: Id[]) => void
) {
  // The order while a row is in hand: the list's, until the drop.
  const [draft, setDraft] = useState<Id[] | null>(null);
  const order = draft ?? settled;
  const orderRef = useRef(order);
  orderRef.current = order;
  // The row in hand: which, where on it the pointer took it, where the
  // pointer is now, how far the row is drawn from its slot, and how far
  // apart the rows' slots are.
  const grab = useRef<{
    id: Id;
    offset: number;
    shift: number;
    slot: number;
    y: number;
  } | null>(null);
  // Its window listeners, so leaving mid-drag lets go of them.
  const release = useRef<(() => void) | null>(null);

  const rowOf = (id: Id) =>
    listRef.current?.querySelector<HTMLElement>(`[data-row="${id}"]`);

  /** The held row, drawn under the pointer from wherever its slot is now. */
  const follow = () => {
    const hand = grab.current;
    const row = hand ? rowOf(hand.id) : null;
    if (!(hand && row)) {
      return;
    }
    const slot = row.getBoundingClientRect().top - hand.shift;
    hand.shift = hand.y - hand.offset - slot;
    row.style.transform = `translateY(${hand.shift}px)`;
  };
  // A move re-renders the list: the row's slot changed under the pointer.
  useLayoutEffect(() => {
    follow();
  }, [draft]);
  useEffect(() => () => release.current?.(), []);

  // The pointer is followed on the window, not on the row: React moves the
  // row's own node when it goes down the list, and a node taken out of the
  // page loses the pointer it had captured.
  const take = (id: Id, event: PointerEvent<HTMLElement>) => {
    const row = rowOf(id);
    const list = listRef.current;
    // A row's own buttons (its eye) keep their clicks.
    if (
      event.button !== 0 ||
      !row ||
      !list ||
      (event.target as HTMLElement).closest("button")
    ) {
      return;
    }
    event.preventDefault();
    const rows = list.querySelectorAll<HTMLElement>("[data-row]");
    const first = rows[0]?.getBoundingClientRect().top;
    const second = rows[1]?.getBoundingClientRect().top;
    grab.current = {
      id,
      offset: event.clientY - row.getBoundingClientRect().top,
      shift: 0,
      slot:
        first === undefined || second === undefined
          ? row.offsetHeight
          : second - first,
      y: event.clientY,
    };
    const before = [...settled];
    setDraft(before);

    const move = (next: globalThis.PointerEvent) => {
      const hand = grab.current;
      const box = listRef.current;
      if (!(hand && box)) {
        return;
      }
      hand.y = next.clientY;
      // The slot the row's top is nearest to.
      const top = box.getBoundingClientRect().top;
      const want = Math.round((hand.y - hand.offset - top) / hand.slot);
      const now = orderRef.current;
      const moved = placed(now, hand.id, want);
      if (moved.some((each, at) => each !== now[at])) {
        orderRef.current = moved;
        setDraft(moved);
      }
      follow();
    };
    const drop = () => {
      release.current?.();
      const hand = grab.current;
      grab.current = null;
      const next = orderRef.current;
      setDraft(null);
      if (next.some((each, at) => each !== before[at])) {
        onMove([...next]);
      }
      const held = hand ? rowOf(hand.id) : null;
      if (!held) {
        return;
      }
      const from = held.style.transform;
      held.style.transform = "";
      if (from && !still()) {
        held.animate([{ transform: from }, { transform: "none" }], {
          duration: SETTLE_MS,
          easing: EASE_OUT,
        });
      }
    };
    release.current = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", drop);
      window.removeEventListener("pointercancel", drop);
      release.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", drop);
    window.addEventListener("pointercancel", drop);
  };

  /** One place up (-1) or down (1), from the keyboard. */
  const moveBy = (id: Id, step: -1 | 1) => {
    const index = settled.indexOf(id);
    if (index !== -1) {
      onMove(placed(settled, id, index + step));
    }
  };

  return {
    heldId: draft ? grab.current?.id : undefined,
    moveBy,
    order,
    take,
  };
}
