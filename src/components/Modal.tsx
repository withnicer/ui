import type { HTMLAttributes, ReactNode } from "react";

import Button from "./Button";
import type { ButtonProps } from "./Button";
import NavButton from "./NavButton";
import Overlay from "./Overlay";

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  button?: ButtonProps;
  children: ReactNode;
  hideCloseButton?: boolean;
  setVisible: (state: boolean) => void;
  title?: string;
  visible: boolean;
}

export default function Modal({
  button,
  children,
  title,
  visible,
  hideCloseButton,
  setVisible,
  className,
  ...rest
}: ModalProps) {
  return (
    visible && (
      <Overlay>
        {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- click-outside-to-dismiss backdrop; it must not be focusable or announced as a control. Escape dismissal is not implemented. */}
        <figure onClick={() => (hideCloseButton ? null : setVisible(false))} />

        <div className={`ui-modal ${className}`} {...rest}>
          <header>
            <h6 className="t-s">{title}</h6>

            {!hideCloseButton && (
              <NavButton
                buttonType="cancel"
                onClick={() => setVisible(false)}
                size="s"
              />
            )}
          </header>

          <div className="content">{children}</div>

          {button && <Button {...button} />}
        </div>
      </Overlay>
    )
  );
}
