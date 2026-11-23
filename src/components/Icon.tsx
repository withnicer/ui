import type { HTMLAttributes } from "react";

interface IconProps extends HTMLAttributes<HTMLElement> {
  misc?: boolean;
  name: string;
  size?: number;
}

export default function Icon({
  misc,
  name,
  size = 24,
  className,
  ...rest
}: IconProps) {
  return (
    <i
      className={`ui-icon icon-${name} ${className ?? ""}`}
      style={{ fontSize: `${misc ? 8 : size}px` }}
      {...rest}
    />
  );
}
