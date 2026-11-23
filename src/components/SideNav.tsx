import {
  type ComponentType,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  type Arrangement,
  defaultArrangement,
  isDefaultArrangement,
  loadArrangement,
  saveArrangement,
  withShownOrder,
} from "../utils/arrangement";
import { useFlip } from "../utils/flip";
import { useDragOrder } from "../utils/use-drag-order";
import Grip from "./Grip";
import Icon from "./Icon";
import IconButton from "./IconButton";
import Tooltip from "./Tooltip";

export interface SideNavItem {
  /** A count on the page's mark, as Community's unread messages. */
  badge?: number;
  icon: string;
  /**
   * Names the page from one render to the next: its place in what the
   * person arranged, its slide, and its tour step (`nav-<key>`).
   */
  key: string;
  label: string;
  route: string;
}

/** What the rail asks of the host's router link. */
export interface SideNavLinkProps {
  children: ReactNode;
  className?: string;
  "data-flip"?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  to: string;
}

export interface SideNavProps {
  /**
   * Every page the rail can hold, in their default order, so a page this
   * person can't see now (another role's, a feature off) keeps its place in
   * what they arranged. The pages' own keys by default.
   */
  allKeys?: readonly string[];
  /**
   * Where this person's arrangement is kept on this device, one per person.
   * Without it there is no Edit menu.
   */
  arrangementKey?: string;
  /** Keeps the rail open, as while a menu in its header is. */
  expanded?: boolean;
  /** After the pages, sliding with them: a divider, links out. */
  footer?: ReactNode;
  /** The pages this person may see, in their default order; none until known. */
  items: SideNavItem[];
  /** The host router's link. */
  Link: ComponentType<SideNavLinkProps>;
  /**
   * The rail's top: the agency switcher, or a link holding the mark and,
   * shown as the rail opens, a `.label`.
   */
  logo: ReactNode;
  /** A page's link clicked: the host may keep it from navigating. */
  onNavigate?: (
    item: SideNavItem,
    event: MouseEvent<HTMLAnchorElement>
  ) => void;
  pathname: string;
}

/** A page is active on its own path and its sub-pages: "/bookings" is not on "/commissions/bookings". */
const isActive = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

/**
 * The apps' left rail: the pages, open over the page on hover, and Edit menu,
 * where a person hides pages and drags the rest into their order, kept per
 * person on this device.
 */
export default function SideNav({
  allKeys,
  arrangementKey,
  expanded,
  footer,
  items,
  Link,
  logo,
  onNavigate,
  pathname,
}: SideNavProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);

  const keys = allKeys ?? items.map((item) => item.key);
  const [arrangement, setArrangement] = useState<Arrangement<string>>(() =>
    defaultArrangement(keys)
  );
  // The person's own arrangement, read again whoever they turn out to be
  // and whatever pages the rail turns out to hold.
  const readFor = `${arrangementKey ?? ""}|${keys.join(",")}`;
  const [arrangedFor, setArrangedFor] = useState("");
  if (arrangedFor !== readFor) {
    setArrangedFor(readFor);
    setArrangement(
      arrangementKey
        ? loadArrangement(arrangementKey, keys)
        : defaultArrangement(keys)
    );
  }
  const arrange = (next: Arrangement<string>) => {
    setArrangement(next);
    if (arrangementKey) {
      saveArrangement(arrangementKey, next);
    }
  };

  // The pages in the order this person put them, without the ones they hid.
  // A hidden page still opens from its links: only its place here goes.
  const movable = arrangement.columns.flatMap((key) =>
    items.filter((item) => item.key === key)
  );
  const fixed = items.filter((item) => !keys.includes(item.key));
  const shown = [
    ...movable.filter((item) => !arrangement.hidden.includes(item.key)),
    ...fixed,
  ];
  const movableKeys = movable.map((item) => item.key);
  const canEdit = Boolean(arrangementKey) && movable.length > 0;

  // While editing, every page this person may see, the hidden ones too,
  // dragged into their order where they stand.
  const drag = useDragOrder(menuRef, movableKeys, (order) =>
    arrange({
      ...arrangement,
      columns: withShownOrder(arrangement.columns, movableKeys, order),
    })
  );
  const editRows = drag.order.flatMap((key) =>
    movable.filter((item) => item.key === key)
  );
  const toggle = (key: string) =>
    arrange({
      ...arrangement,
      hidden: arrangement.hidden.includes(key)
        ? arrangement.hidden.filter((each) => each !== key)
        : [...arrangement.hidden, key],
    });

  // Done, Escape or a click off the rail ends the editing.
  useEffect(() => {
    if (!editing) {
      return undefined;
    }
    const onPointerDown = (event: globalThis.MouseEvent) => {
      if (!railRef.current?.contains(event.target as Node)) {
        setEditing(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEditing(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [editing]);

  // A page hidden, shown again or moved, and the editing opened or closed:
  // the others slide to their places, and one that shows fades in.
  useFlip(
    menuRef,
    items.length > 0
      ? editing
        ? [...drag.order, ...fixed.map((item) => item.key)]
        : shown.map((item) => item.key)
      : [],
    "y",
    { enter: true }
  );

  const pageLink = (item: SideNavItem) => (
    <Link
      className={isActive(pathname, item.route) ? "active" : undefined}
      data-flip={item.key}
      key={item.key}
      onClick={(event) => onNavigate?.(item, event)}
      to={item.route}
    >
      {/* Inline-flex, so a tour's spotlight hugs the mark and the name while
          the whole row stays the link. */}
      <span className="nav-content" data-tour={`nav-${item.key}`}>
        <div className="nav-icon-wrapper">
          <Icon name={item.icon} />
          {item.badge ? (
            <span className="nav-badge t-xxxs">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          ) : null}
        </div>
        <p className="t-xxs">{item.label}</p>
      </span>
    </Link>
  );

  return (
    <>
      <div
        className={
          expanded || editing
            ? "ui-side-nav no-scrollbar expanded"
            : "ui-side-nav no-scrollbar"
        }
        id="navbar"
        ref={railRef}
      >
        <div className="side-nav-logo" id="logo">
          {/* The logo takes the row, so Edit menu sits at its far end. */}
          <div className="side-nav-brand">{logo}</div>
          {/* Edit menu, beside the logo, there with the labels as the rail
              opens: its sliders turn the pages into the editor and, while
              editing, a check is Done. */}
          {canEdit ? (
            <Tooltip label={editing ? "Done" : "Edit menu"}>
              <span className="nav-edit-toggle" data-tour="nav-edit">
                <IconButton
                  aria-label={editing ? "Done" : "Edit menu"}
                  aria-pressed={editing}
                  buttonType={editing ? "secondary" : "tertiary"}
                  circle
                  icon={editing ? "check" : "settings"}
                  onClick={() => setEditing((current) => !current)}
                  size="s"
                />
              </span>
            </Tooltip>
          ) : null}
        </div>

        {/* While editing, in the room under the logo: the hint, and Reset
            when there is something to undo. */}
        {canEdit && editing ? (
          <div className="nav-tools">
            <p className="t-xxs hint">Drag to reorder</p>
            {isDefaultArrangement(arrangement, keys) ? null : (
              <Tooltip label="Reset to default">
                <span className="tool">
                  <IconButton
                    aria-label="Reset to default"
                    buttonType="tertiary"
                    circle
                    icon="rotate-left"
                    onClick={() => arrange(defaultArrangement(keys))}
                    size="s"
                  />
                </span>
              </Tooltip>
            )}
          </div>
        ) : null}

        <div
          className={drag.heldId ? "sorting" : undefined}
          data-tour="menu"
          id="menu"
          ref={menuRef}
        >
          {/* Editing: each page this person may see, a hidden one softer,
              dragged where it stands (or moved with Alt and the arrows),
              its eye hiding or showing it. */}
          {editing
            ? editRows.map((item) => {
                const off = arrangement.hidden.includes(item.key);
                const held = drag.heldId === item.key;
                return (
                  <div
                    aria-label={`Move ${item.label}: drag, or Alt and the arrow keys`}
                    className={
                      held
                        ? off
                          ? "nav-row off held"
                          : "nav-row held"
                        : off
                          ? "nav-row off"
                          : "nav-row"
                    }
                    data-flip={held ? undefined : item.key}
                    data-row={item.key}
                    key={item.key}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) {
                        return;
                      }
                      if (event.altKey && event.key === "ArrowUp") {
                        event.preventDefault();
                        drag.moveBy(item.key, -1);
                      } else if (event.altKey && event.key === "ArrowDown") {
                        event.preventDefault();
                        drag.moveBy(item.key, 1);
                      }
                    }}
                    onPointerDown={(event) => drag.take(item.key, event)}
                    role="button"
                    tabIndex={0}
                  >
                    {/* In the rail's own margin, so the pages keep their
                        place: what says the row can be dragged. */}
                    <span aria-hidden="true" className="nav-grip">
                      <Grip />
                    </span>
                    <span className="nav-content">
                      <div className="nav-icon-wrapper">
                        <Icon name={item.icon} />
                      </div>
                      <p className="t-xxs">{item.label}</p>
                    </span>
                    <Tooltip
                      label={off ? `Show ${item.label}` : `Hide ${item.label}`}
                    >
                      <span className="eye">
                        <IconButton
                          aria-label={
                            off ? `Show ${item.label}` : `Hide ${item.label}`
                          }
                          aria-pressed={!off}
                          buttonType="tertiary"
                          circle
                          icon={off ? "hidden" : "visible"}
                          onClick={() => toggle(item.key)}
                          size="s"
                        />
                      </span>
                    </Tooltip>
                  </div>
                );
              })
            : null}

          {(editing ? fixed : shown).map(pageLink)}

          {footer}
        </div>
      </div>

      <div className="ui-side-nav-overlay" id="navbar-overlay" />
    </>
  );
}
