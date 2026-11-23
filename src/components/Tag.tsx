import type { HTMLAttributes } from "react";

import Icon from "./Icon";

interface TagProps extends HTMLAttributes<HTMLParagraphElement> {
  disabled?: boolean;
  label: string;
  onRemove?: () => void;
  type: "default" | "positive" | "warning" | "negative" | "disabled";
}

export default function Tag({
  disabled: _disabled,
  label,
  type = "default",
  onRemove,
  ...rest
}: TagProps) {
  return (
    <p className={`ui-tag ${type}`} {...rest}>
      {label}

      {onRemove && (
        <button onClick={onRemove} type="button">
          <Icon name="misc-cancel" size={8} />
        </button>
      )}
    </p>
  );
}
