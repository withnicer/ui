import { type ButtonHTMLAttributes, forwardRef } from "react";

import Icon from "./Icon";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  buttonType: "primary" | "secondary" | "tertiary" | "destructive";
  circle?: boolean;
  icon: string;
  size: "l" | "m" | "s";
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ buttonType, circle, icon, size, ...rest }, ref) => {
    return (
      <button
        className={`ui-icon-button ${buttonType} ${size} ${circle ? "circle" : ""}`}
        ref={ref}
        type="button"
        {...rest}
      >
        <Icon name={icon} size={size === "l" ? 24 : size === "m" ? 18 : 12} />
      </button>
    );
  }
);

export default IconButton;
