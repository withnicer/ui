import type { InputHTMLAttributes } from "react";

import Icon from "./Icon";

interface CheckProps extends InputHTMLAttributes<HTMLInputElement> {
  circle?: boolean;
}

export default function Check({ circle, ...rest }: CheckProps) {
  return (
    <div className={`ui-check ${circle ? "circle" : ""}`}>
      <input type="checkbox" {...rest} />

      <Icon name="misc-check" size={8} />
    </div>
  );
}
