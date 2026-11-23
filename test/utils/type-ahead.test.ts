import { describe, expect, it } from "vite-plus/test";

import { findTypeAheadMatch } from "../../src/utils/type-ahead";

// The phone picker's labels, flag first.
const COUNTRIES = [
  "🇦🇫 Afghanistan (+93)",
  "🇦🇽 Åland Islands (+358)",
  "🇦🇷 Argentina (+54)",
  "🇦🇲 Armenia (+374)",
  "🇧🇷 Brazil (+55)",
  "🇨🇴 Colombia (+57)",
];

describe("findTypeAheadMatch", () => {
  it("lands on the first label that starts with what was typed, past the flag", () => {
    expect(findTypeAheadMatch(COUNTRIES, "arg", null)).toBe(2);
    expect(findTypeAheadMatch(COUNTRIES, "ARM", null)).toBe(3);
    expect(findTypeAheadMatch(COUNTRIES, "col", 4)).toBe(5);
  });

  it("reads accents as plain letters", () => {
    expect(findTypeAheadMatch(COUNTRIES, "ala", null)).toBe(1);
  });

  it("steps through the labels when the same letter is typed again", () => {
    expect(findTypeAheadMatch(COUNTRIES, "a", null)).toBe(0);
    expect(findTypeAheadMatch(COUNTRIES, "a", 0)).toBe(1);
    expect(findTypeAheadMatch(COUNTRIES, "aa", 1)).toBe(2);
    // Past the last one it starts over.
    expect(findTypeAheadMatch(COUNTRIES, "a", 3)).toBe(0);
  });

  it("finds nothing for text no label starts with", () => {
    expect(findTypeAheadMatch(COUNTRIES, "zz", null)).toBeNull();
    expect(findTypeAheadMatch(COUNTRIES, "rgentina", null)).toBeNull();
    expect(findTypeAheadMatch(COUNTRIES, " ", null)).toBeNull();
  });
});
