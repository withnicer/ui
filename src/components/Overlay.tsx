import type { HTMLAttributes, ReactNode } from "react";

interface OverlayProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  onClose?: (state: boolean) => void;
}

export default function Overlay({ children, onClose, ...rest }: OverlayProps) {
  return (
    <div className="ui-overlay" {...rest}>
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- click-outside-to-dismiss backdrop; it must not be focusable or announced as a control. Escape dismissal is not implemented. */}
      {onClose && <figure onClick={() => onClose(false)} />}

      {children}
    </div>
  );
}
