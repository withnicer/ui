import type { InputHTMLAttributes } from "react";

import Icon from "./Icon";

interface CheckProps extends InputHTMLAttributes<HTMLInputElement> {
  circle?: boolean;
  /**
   * Some of what it stands for is chosen, not all: drawn checked with a
   * dash instead of a tick (a group whose items are partly selected).
   */
  partial?: boolean;
}

export default function Check({
  circle,
  partial = false,
  ...rest
}: CheckProps) {
  return (
    <div className={`ui-check ${circle ? "circle" : ""}`}>
      <input
        type="checkbox"
        {...rest}
        {...(partial ? { "aria-checked": "mixed" as const } : null)}
      />

      <Icon name={partial ? "misc-minus" : "misc-check"} size={8} />
    </div>
  );
}
