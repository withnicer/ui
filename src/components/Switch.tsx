import {
  type ButtonHTMLAttributes,
  type MouseEvent,
  useEffect,
  useState,
} from "react";

interface SwitchProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> {
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  size: "l" | "s";
}

export default function Switch({
  defaultChecked,
  onChange,
  size,
  ...rest
}: SwitchProps) {
  const [checked, setChecked] = useState<boolean>(defaultChecked ?? false);

  useEffect(() => {
    setChecked(defaultChecked ?? false);
  }, [defaultChecked]);

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    const nextChecked = !checked;
    setChecked(nextChecked);

    rest.onClick?.(e);
    onChange?.(nextChecked);
  }

  // Render
  return (
    // A switch to assistive technology, on or off: the node stays a button.
    <button
      aria-checked={checked}
      className={`ui-switch ${size} ${checked ? "checked" : ""}`}
      role="switch"
      type="button"
      {...rest}
      onClick={handleClick}
    />
  );
}
