import type { ButtonHTMLAttributes } from "react";

import Icon from "./Icon";

interface NavButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  buttonType: "back" | "forward" | "cancel" | "more" | "less";
  size: "l" | "s";
}

export default function NavButton({
  size,
  buttonType,
  ...rest
}: NavButtonProps) {
  // Icon map
  const iconMap = {
    back: "arrow-left",
    forward: "arrow-right",
    cancel: "cancel",
    more: "plus",
    less: "minus",
  };

  // Render
  return (
    <button className={`ui-nav-button ${size}`} type="button" {...rest}>
      <Icon name={`misc-${iconMap[buttonType]}`} size={8} />
    </button>
  );
}
