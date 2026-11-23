import { type RefObject, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import Icon from "./Icon";

interface OptionsProps {
  action: () => void;
  destructive?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  icon?: string;
  label: string;
}

interface ActionsProps {
  options: OptionsProps[];
  setVisible: (state: boolean) => void;
  triggerRef: RefObject<HTMLElement | null>;
  visible: boolean;
}

export default function Actions({
  options,
  visible,
  setVisible,
  triggerRef,
}: ActionsProps) {
  const listRef = useRef<HTMLUListElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (listRef.current?.contains(e.target as Node)) return;
      if (triggerRef?.current?.contains(e.target as Node)) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    document.body.addEventListener("click", handleClick);

    return () => {
      document.body.removeEventListener("click", handleClick);
    };
  }, [triggerRef]);

  // Track trigger position with rAF; close if trigger scrolls out of view
  useEffect(() => {
    if (!visible || !triggerRef?.current) return;

    let frameId: number;

    const track = () => {
      if (triggerRef.current && listRef.current) {
        const r = triggerRef.current.getBoundingClientRect();

        // Close if trigger is outside the viewport
        if (
          r.bottom < 0 ||
          r.top > window.innerHeight ||
          r.right < 0 ||
          r.left > window.innerWidth
        ) {
          setVisible(false);
          return;
        }

        listRef.current.style.top = `${r.bottom + 4}px`;
        listRef.current.style.right = `${window.innerWidth - r.right}px`;
      }
      frameId = requestAnimationFrame(track);
    };

    frameId = requestAnimationFrame(track);

    return () => cancelAnimationFrame(frameId);
  }, [visible, triggerRef]);

  if (!visible) return null;

  return createPortal(
    <ul
      className="ui-actions"
      ref={listRef}
      style={{ position: "fixed", zIndex: 1100, top: 0, right: 0 }}
    >
      {options
        ?.filter((opt) => !opt.hidden)
        .map((option, i) => (
          <li
            className={
              [
                option.destructive ? "destructive" : "",
                option.disabled ? "disabled" : "",
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              if (option.disabled) return;
              setVisible(false);
              option.action();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                if (option.disabled) return;
                setVisible(false);
                option.action();
              }
            }}
            aria-disabled={option.disabled || undefined}
            role="button"
            tabIndex={option.disabled ? -1 : 0}
          >
            {option.icon && <Icon name={option.icon} size={18} />}

            <p>{option.label}</p>
          </li>
        ))}
    </ul>,
    document.body
  );
}
