import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  children: React.ReactNode;
  className?: string;
  /** Off: no bubble and no help cursor — a label only worth showing sometimes. */
  disabled?: boolean;
  /** Usually a line of text; a list when there is more than one thing to say. */
  label: React.ReactNode;
}

const MAX_WIDTH = 300;
/** Gap between the anchor and the bubble. */
const OFFSET = 8;
/** Room kept between the bubble and the viewport edges. */
const EDGE = 16;

/**
 * A hover label. The bubble renders on `document.body` at fixed viewport
 * coordinates, so a scrolling rail or a card with `overflow: hidden` can't
 * clip it. It opens below the anchor, left edges aligned; it moves above
 * when there is no room below and slides left to stay on screen. Content
 * that needs its own styles must carry them (a styled element as `label`),
 * since the bubble no longer sits inside the host's markup.
 */
export default function Tag({
  label,
  children,
  className,
  disabled = false,
  ...rest
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number }>();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const calculatePosition = () => {
    if (!(tooltipRef.current && containerRef.current)) {
      return;
    }

    const anchor = containerRef.current.getBoundingClientRect();
    const { height, width } = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = anchor.left;
    if (left + width > viewportWidth - EDGE) {
      left = anchor.right - width;
    }
    left = Math.max(EDGE, Math.min(left, viewportWidth - EDGE - width));

    let top = anchor.bottom + OFFSET;
    const above = anchor.top - OFFSET - height;
    if (top + height > viewportHeight - EDGE && above >= EDGE) {
      top = above;
    }

    setPosition({ left, top });
  };

  // Measured before paint, so the bubble never flashes at the corner.
  useLayoutEffect(() => {
    if (visible) {
      calculatePosition();
    } else {
      setPosition(undefined);
    }
  }, [visible, label]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const handle = () => calculatePosition();
    window.addEventListener("resize", handle);
    // Capture, so a scrolling rail moves it too, not only the page.
    window.addEventListener("scroll", handle, true);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
    };
  }, [visible]);

  return (
    <div
      className={["ui-tooltip", disabled ? "disabled" : "", className]
        .filter(Boolean)
        .join(" ")}
      ref={containerRef}
      {...rest}
      // Focus opens it too, so a keyboard reaches what a mouse hovers.
      onBlur={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {visible && !disabled
        ? createPortal(
            <div
              className="ui-tooltip-bubble t-xxs"
              ref={tooltipRef}
              role="tooltip"
              style={{
                left: position?.left ?? 0,
                maxWidth: `min(${MAX_WIDTH}px, calc(100vw - ${EDGE * 2}px))`,
                top: position?.top ?? 0,
                visibility: position ? "visible" : "hidden",
              }}
            >
              {label}
            </div>,
            document.body
          )
        : null}
      {children}
    </div>
  );
}
