import type { SelectHTMLAttributes } from "react";

export interface SelectOption {
  defaultValue?: string;
  label: string;
  selected?: boolean;
  value: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  defaultValue?: string;
  options?: SelectOption[];
  placeholder?: string;
  readOnly?: boolean;
  variant?: "outlined" | "standard";
}

export default function Select({
  className,
  options,
  placeholder,
  variant,
  defaultValue = "",
  readOnly,
  style,
  ...rest
}: SelectProps) {
  return (
    <select
      className={[
        "ui-select",
        variant === "standard" ? "standard" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      // Given a value, it is controlled: a default as well makes React warn.
      defaultValue={rest.value === undefined ? defaultValue : undefined}
      style={{ ...style, pointerEvents: readOnly ? "none" : "all" }}
      {...rest}
    >
      {placeholder && (
        <option disabled value="">
          {placeholder}
        </option>
      )}

      {options?.map((option, i) => (
        <option key={i} selected={option.selected} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
