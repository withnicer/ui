import { Fragment, type MouseEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { findTypeAheadMatch, TYPE_AHEAD_RESET_MS } from "../utils/type-ahead";
import Check from "./Check";
import Icon from "./Icon";

const MIN_LIST_WIDTH = 320;

/** Text as a search compares it: no case, no accents ("Jesús" is "jesus"). */
const folded = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "")
    .toLowerCase();

export interface DropdownOption<T> {
  /** A second, softer line under the label: what tells two alike apart. */
  description?: string;
  endDecorator?: React.ReactNode;
  label: string;
  /**
   * The heading this option sits under. A heading prints wherever the
   * section changes, so options arrive already grouped.
   */
  section?: string;
  startDecorator?: React.ReactNode;
  value?: T;
}

export interface DropdownProps<T> {
  anchorEl?: React.RefObject<HTMLElement | null>;
  onSelect?: (value?: T) => void;
  options: DropdownOption<T>[];
  /**
   * A field over the options, this its placeholder, that narrows them as
   * you type, by the label or the line under it; the arrows move and Enter
   * picks the first match. For a long list opened from a button.
   */
  search?: string;
  selectedOptions?: T[];
  setVisible: (state: boolean) => void;
  /**
   * Every option shows its box, empty until it is the chosen one, so the
   * rows line up and the choice reads as one of them. For a list of
   * choices opened from a button.
   */
  showChecks?: boolean;
  /**
   * The keyboard picks, as in a native select: typing jumps to the first
   * option that starts with it, the arrows move, Enter picks and Escape
   * closes. For a list opened from a button — under a text input the typing
   * belongs to the input.
   */
  typeAhead?: boolean;
  visible: boolean;
}

export default function Dropdown<T>({
  options,
  visible,
  setVisible,
  onSelect,
  search,
  selectedOptions,
  anchorEl,
  showChecks,
  typeAhead,
}: DropdownProps<T>) {
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  // The option the keyboard is on, and what was typed to get there.
  const [active, setActive] = useState<number | null>(null);
  const typed = useRef({ at: 0, query: "" });
  // What the search field holds; the options it leaves.
  const [query, setQuery] = useState("");
  const searchable = search !== undefined;
  const wanted = folded(query.trim());
  const shown = wanted
    ? options.filter((option) =>
        folded(`${option.label} ${option.description ?? ""}`).includes(wanted)
      )
    : options;

  useEffect(() => {
    const handleBodyClick = (e: Event) => {
      if (listRef.current?.contains(e.target as Node)) {
        return;
      }
      // Don't close when the click happens on the anchor that opened the
      // dropdown (e.g. clicking the Autocomplete input shouldn't close it
      // mid-open). The anchor owns its own visibility logic.
      if (anchorEl?.current?.contains(e.target as Node)) {
        return;
      }
      setVisible(false);
    };
    document.body.addEventListener("click", handleBodyClick);
    return () => document.body.removeEventListener("click", handleBodyClick);
  }, [anchorEl]);

  // Continuously track anchor position via rAF so the dropdown follows on scroll/resize
  useEffect(() => {
    if (!visible || !anchorEl?.current) {
      return;
    }

    let frameId: number;

    const track = () => {
      if (anchorEl.current && listRef.current) {
        const r = anchorEl.current.getBoundingClientRect();
        listRef.current.style.top = `${r.bottom}px`;
        // A picker narrower than its rows (the flight origin box) gets a
        // wider list, kept inside the viewport.
        const width = Math.min(
          Math.max(r.width, MIN_LIST_WIDTH),
          window.innerWidth - 32
        );
        listRef.current.style.left = `${Math.min(r.left, window.innerWidth - 16 - width)}px`;
        listRef.current.style.width = `${width}px`;
        listRef.current.style.minWidth = `${width}px`;
      }
      frameId = requestAnimationFrame(track);
    };

    frameId = requestAnimationFrame(track);

    return () => cancelAnimationFrame(frameId);
  }, [visible, anchorEl]);

  useEffect(() => {
    if (!(visible && (typeAhead || searchable))) {
      return undefined;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (event.key === "Escape") {
        setVisible(false);
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (shown.length === 0) {
          return;
        }
        const step = event.key === "ArrowDown" ? 1 : -1;
        // From nothing, down is the first option and up the last; both wrap.
        const from = active ?? (step > 0 ? -1 : shown.length);
        setActive((from + step + shown.length) % shown.length);
        return;
      }
      if (event.key === "Enter") {
        // Picks instead of submitting the form the field sits in.
        if (active !== null && shown[active]) {
          event.preventDefault();
          onSelect?.(shown[active]?.value);
        }
        return;
      }
      // With a search field, what is typed goes into it.
      if (searchable || event.key.length !== 1) {
        return;
      }
      const now = Date.now();
      const query =
        now - typed.current.at > TYPE_AHEAD_RESET_MS
          ? event.key
          : typed.current.query + event.key;
      // A lone space still presses the focused button.
      if (!query.trim()) {
        return;
      }
      event.preventDefault();
      typed.current = { at: now, query };
      const match = findTypeAheadMatch(
        options.map((option) => option.label),
        query,
        active
      );
      if (match !== null) {
        setActive(match);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    active,
    onSelect,
    options,
    searchable,
    setVisible,
    shown,
    typeAhead,
    visible,
  ]);

  // Closed, the next opening starts afresh; open, the cursor is in the
  // search field.
  useEffect(() => {
    if (!visible) {
      typed.current = { at: 0, query: "" };
      setQuery("");
    } else if (searchable) {
      const frame = requestAnimationFrame(() => searchRef.current?.focus());
      return () => {
        cancelAnimationFrame(frame);
        setActive(null);
      };
    }
    return () => setActive(null);
  }, [searchable, visible]);

  // The option the keyboard landed on scrolls into the list's view.
  useEffect(() => {
    if (active !== null) {
      listRef.current
        ?.querySelector(`[data-option-index="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [active]);

  if (!visible) {
    return null;
  }

  const sectioned = options.some((option) => option.section);

  const list = (
    <ul
      className={[
        "ui-dropdown",
        sectioned ? "sectioned" : "",
        searchable ? "searchable" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      ref={listRef}
      style={anchorEl ? { position: "fixed", zIndex: 1100 } : undefined}
    >
      {searchable ? (
        <li className="search" role="presentation">
          <Icon name="search" size={12} />
          <input
            aria-label={search}
            onChange={(event) => {
              setQuery(event.target.value);
              // The first match is the one Enter picks.
              setActive(event.target.value.trim() ? 0 : null);
            }}
            placeholder={search}
            ref={searchRef}
            value={query}
          />
        </li>
      ) : null}
      {searchable && shown.length === 0 ? (
        <li className="empty" role="presentation">
          No matches
        </li>
      ) : null}
      {shown.map((option, i) => (
        <Fragment key={i}>
          {option.section && option.section !== shown[i - 1]?.section ? (
            <li className="section" role="presentation">
              {option.section}
            </li>
          ) : null}
          <Option
            active={i === active}
            checked={option.value && selectedOptions?.includes(option.value)}
            index={i}
            showCheck={showChecks}
            onClick={() => onSelect?.(option.value)}
            option={option}
          />
        </Fragment>
      ))}
    </ul>
  );

  if (anchorEl) {
    return createPortal(list, document.body);
  }

  return list;
}

interface OptionsProps<T> {
  /** The keyboard is on it (`typeAhead`). */
  active?: boolean;
  checked?: boolean;
  /** Its place in the list, for the keyboard to scroll to. */
  index?: number;
  onClick?: () => void;
  option: DropdownOption<T>;
  /** Its box shows unchecked too (`showChecks`). */
  showCheck?: boolean;
}

export function Option<T>({
  active,
  checked,
  index,
  option,
  onClick,
  showCheck,
}: OptionsProps<T>) {
  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    onClick?.();
  }

  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- when checked this row already contains the focusable <Check> input; role="button" + tabIndex here would nest focusables and announce the row as a button.
    <li
      className={active ? "active" : undefined}
      data-option-index={index}
      onClick={handleClick}
    >
      {checked ? <Check checked readOnly /> : null}
      {/* An empty box is only the row's mark: the row is what picks. */}
      {!checked && showCheck ? (
        <Check checked={false} readOnly tabIndex={-1} />
      ) : null}
      {option.startDecorator}
      {option.description ? (
        <div className="option-text">
          <p>{option.label}</p>
          <p className="t-xxs description">{option.description}</p>
        </div>
      ) : (
        <p>{option.label}</p>
      )}
      {option.endDecorator}
    </li>
  );
}
