import Button from "./Button";
import type { ButtonProps } from "./Button";
import NavButton from "./NavButton";
import Overlay from "./Overlay";

interface DialogProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  actions: DialogAction[];
  children?: React.ReactNode;
  description?: string;
  setVisible: (state: boolean) => void;
  /**
   * The heading, in the header beside the close button as the Modal sets
   * it; the content scrolls under it. It used to fall through to the box as
   * a tooltip, so every titled dialog opened without one.
   */
  title?: string;
}

interface DialogAction {
  disabled?: boolean;
  hierarchy: ButtonProps["buttonType"];
  label: string;
  onClick: () => void;
}

const Dialog = ({
  actions,
  description,
  setVisible,
  children,
  title,
  ...rest
}: DialogProps) => {
  return (
    <Overlay onClose={() => setVisible(false)}>
      <div className="ui-dialog" {...rest}>
        <header>
          {title ? <h6 className="t-s">{title}</h6> : null}
          <NavButton
            buttonType="cancel"
            onClick={() => setVisible(false)}
            size="s"
          />
        </header>

        {description ? <p>{description}</p> : null}
        {children ? <div className="content">{children}</div> : null}

        <footer>
          {actions.map((action, i) => (
            <Button
              buttonType={action.hierarchy}
              key={i}
              label={action.label}
              onClick={action.onClick}
              size="m"
              state={action.disabled ? "disabled" : undefined}
            />
          ))}
        </footer>
      </div>
    </Overlay>
  );
};

export default Dialog;
