import { useEffect } from "react";

import Icon from "./Icon";

export interface ToastAction {
  /** Its mark before the label, as Undo's rotate-left. */
  icon?: string;
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  /** One thing to do about it, before the ring or the close: Undo. */
  action?: ToastAction;
  autoClose?: boolean;
  description: string;
  setVisible: (state: boolean) => void;
  type: "info" | "success" | "warning" | "error";
  visible: boolean;
}

export default function Toast({
  action,
  autoClose,
  description,
  type,
  visible,
  setVisible,
}: ToastProps) {
  // Close; a toast that went sooner takes its timer with it, so it never
  // closes the one that came after it.
  useEffect(() => {
    if (!autoClose) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Render
  return (
    visible && (
      <div className={`ui-toast ${type}`}>
        <figure>
          <Icon name={type === "warning" ? "alert" : type} size={16} />
        </figure>

        <p>{description}</p>

        {action ? (
          <button
            className="action"
            onClick={() => {
              action.onClick();
              setVisible(false);
            }}
            type="button"
          >
            {action.icon ? <Icon name={action.icon} size={12} /> : null}
            {action.label}
          </button>
        ) : null}

        {autoClose ? (
          <svg>
            <path d="M12,5c3.87,0,7,3.13,7,7s-3.13,7-7,7-7-3.13-7-7,3.13-7,7-7" />
          </svg>
        ) : (
          <button onClick={() => setVisible(false)}>
            <Icon name="cancel" size={16} />
          </button>
        )}
      </div>
    )
  );
}
