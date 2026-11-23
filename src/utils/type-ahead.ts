/** How long a pause starts a new search, as a native select does. */
export const TYPE_AHEAD_RESET_MS = 1000;

/**
 * What a label is searched by: lowercase, without accents, and from its first
 * letter or digit — "🇦🇷 Argentina (+54)" is found by typing "arg".
 */
const searchable = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .toLowerCase();

/**
 * The option typing `query` lands on, as in a native select: the first label
 * that starts with it. The same letter typed again ("a", "aa"…) steps to the
 * next label starting with it, after `current`. Null when nothing matches.
 */
export const findTypeAheadMatch = (
  labels: readonly string[],
  query: string,
  current: number | null
): number | null => {
  const typed = searchable(query);
  if (!typed) {
    return null;
  }
  const texts = labels.map(searchable);
  const letter = typed[0] ?? "";
  if ([...typed].every((char) => char === letter)) {
    const start = current === null ? 0 : current + 1;
    for (let step = 0; step < texts.length; step += 1) {
      const index = (start + step) % texts.length;
      if (texts[index]?.startsWith(letter)) {
        return index;
      }
    }
    return null;
  }
  const index = texts.findIndex((text) => text.startsWith(typed));
  return index === -1 ? null : index;
};
