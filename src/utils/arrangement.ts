/**
 * How a person arranged a board's columns (their order, and which are off
 * it), kept per person on this device. The pipeline's stages, My tasks' due
 * dates and the sidebar's pages keep theirs this way, each under its own key.
 */
export interface Arrangement<Id extends string> {
  /** Every column, in the board's order. */
  columns: Id[];
  /** The columns off the board. */
  hidden: Id[];
}

/** The board as it comes: every column, in its own order. */
export const defaultArrangement = <Id extends string>(
  all: readonly Id[]
): Arrangement<Id> => ({ columns: [...all], hidden: [] });

export const isDefaultArrangement = <Id extends string>(
  arrangement: Arrangement<Id>,
  all: readonly Id[]
): boolean =>
  arrangement.hidden.length === 0 &&
  arrangement.columns.every((column, index) => column === all[index]);

/**
 * A saved arrangement as the board reads it now: columns it no longer has
 * are dropped, and one it has that the saved order lacks goes after the
 * one it follows in the board's own order. Anything else reads as nothing
 * arranged.
 */
export const arrangementFrom = <Id extends string>(
  saved: unknown,
  all: readonly Id[]
): Arrangement<Id> => {
  if (typeof saved !== "object" || saved === null) {
    return defaultArrangement(all);
  }
  const known = (list: unknown): Id[] =>
    Array.isArray(list)
      ? [...new Set(list)].filter((column): column is Id =>
          all.includes(column as Id)
        )
      : [];
  const { columns, hidden } = saved as Record<string, unknown>;
  const order = known(columns);
  for (const [index, column] of all.entries()) {
    if (!order.includes(column)) {
      const before = all[index - 1];
      order.splice(before ? order.indexOf(before) + 1 : 0, 0, column);
    }
  }
  return { columns: order, hidden: known(hidden) };
};

/** No storage at all (a private window) reads as nothing arranged. */
export const loadArrangement = <Id extends string>(
  key: string,
  all: readonly Id[]
): Arrangement<Id> => {
  try {
    const raw = window.localStorage.getItem(key);
    return arrangementFrom(raw ? JSON.parse(raw) : null, all);
  } catch {
    return defaultArrangement(all);
  }
};

export const saveArrangement = <Id extends string>(
  key: string,
  arrangement: Arrangement<Id>
) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(arrangement));
  } catch {
    // No storage (a private window, a full quota): the board still works.
  }
};

/**
 * The whole order with the ones this person sees put in their new order,
 * the ones they can't see (another role's, a feature off) where they were.
 */
export const withShownOrder = <Id extends string>(
  order: readonly Id[],
  shown: readonly Id[],
  next: readonly Id[]
): Id[] => {
  let at = 0;
  return order.map((key) => {
    if (!shown.includes(key)) {
      return key;
    }
    const placed = next[at] ?? key;
    at += 1;
    return placed;
  });
};
