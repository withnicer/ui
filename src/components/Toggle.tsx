import { type HTMLAttributes, useEffect, useState } from "react";

import Icon from "./Icon";

interface ToggleOption {
  /** Something after the label, such as an unread mark. */
  icon?: React.ReactNode;
  /** A kit icon before the label, as a view switch shows each view. */
  iconLeft?: string;
  label: string;
  onClick: () => void;
}

interface ToggleProps extends HTMLAttributes<HTMLDivElement> {
  /** A negative index selects nothing — no option is highlighted. */
  defaultSelected?: number;
  disabled?: boolean;
  options: ToggleOption[];
  size?: "l" | "s" | "xl";
}

export default function Toggle({
  options,
  defaultSelected,
  disabled,
  size = "l",
  ...rest
}: ToggleProps) {
  const [selected, setSelected] = useState<number>(defaultSelected || 0);

  // Select
  function select(index: number, action: () => void) {
    setSelected(index);
    action();
  }

  useEffect(() => {
    setSelected(defaultSelected || 0);
  }, [defaultSelected]);

  // Render
  return (
    <div
      className={`ui-toggle ${size} ${disabled ? "disabled" : ""}`}
      {...rest}
    >
      {selected >= 0 ? (
        <figure
          style={{
            width: `calc((100% - ${size === "l" ? 8 : 4}px) / ${options.length})`,
            transform: `translateX(${selected}00%)`,
          }}
        />
      ) : null}

      {options.map((option, i) => (
        <button
          className={
            [selected === i ? "active" : "", option.iconLeft ? "with-icon" : ""]
              .filter(Boolean)
              .join(" ") || undefined
          }
          key={i}
          onClick={() => select(i, option.onClick)}
          type="button"
        >
          {option.iconLeft ? <Icon name={option.iconLeft} size={12} /> : null}
          {option.label}
          {option.icon && <span className="icon">{option.icon}</span>}
        </button>
      ))}
    </div>
  );
}
