import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import Icon from "./Icon";
import Spinner from "./Spinner";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  buttonType: "primary" | "secondary" | "tertiary" | "destructive";
  dropdown?: boolean;
  iconLeft?: string;
  /** Defaults to the kit's 10px, small for a plain glyph like `plus`. */
  iconSize?: number;
  label: string;
  size: "l" | "m" | "s";
  state?: "loading" | "success" | "error" | "disabled";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { dropdown, iconLeft, iconSize, label, size, state, buttonType, ...rest },
    ref
  ) => {
    const content = (
      <>
        {iconLeft && <Icon name={iconLeft} size={iconSize ?? 10} />}

        {label}

        {dropdown && <Icon name="misc-chevron-down" size={8} />}
      </>
    );
    let status: ReactNode = null;
    if (state === "loading") {
      status = <Spinner />;
    } else if (state === "success") {
      status = <Icon name="check" />;
    } else if (state === "error") {
      status = <Icon name="cancel" />;
    }

    return (
      <button
        className={`ui-button ${size} ${state || ""} ${buttonType}`}
        disabled={!!state}
        ref={ref}
        type="button"
        {...rest}
      >
        {status ? (
          <>
            {/* The label keeps its room, unseen, so the button keeps its
                width while it works; the state shows in its middle. */}
            <span aria-hidden="true" className="held">
              {content}
            </span>
            <span className="status">{status}</span>
          </>
        ) : (
          content
        )}
      </button>
    );
  }
);

export default Button;
