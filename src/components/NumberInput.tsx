import { type ChangeEvent, useState } from "react";

import NavButton from "./NavButton";

interface NumberInputProps {
  defaultValue?: number | string;
  disabled?: boolean;
  id?: string;
  maxValue?: number;
  minValue?: number;
  name?: string;
  onChange?: (value: number | string) => void;
  required?: boolean;
  unit?: {
    singular: string;
    plural: string;
  };
  /** Given, the host holds the number: a reset from outside shows. */
  value?: number;
}

export default function NumberInput({
  id,
  defaultValue,
  disabled,
  minValue = 0,
  maxValue = Number.POSITIVE_INFINITY,
  name,
  onChange,
  required,
  unit,
  value: held,
}: NumberInputProps) {
  const [typed, setValue] = useState<any>(defaultValue || minValue);
  const value = held ?? typed;

  // Handle change
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const number = value
      ? Number.parseInt(value.replace(/[^0-9]/g, ""), 10)
      : "";

    setValue(number);

    onChange?.(e.target.value);
  }

  // Handle blur: a typed value outside the limits settles on the nearest
  // one, and the host hears it — the max used to be enforced by the buttons
  // only.
  function handleBlur() {
    const typed = Number(value);
    const settled = Math.min(
      maxValue,
      Math.max(minValue, Number.isFinite(typed) ? typed : minValue)
    );
    if (settled !== typed) {
      onChange?.(settled);
    }
    setValue(settled);
  }

  // Render
  return (
    <div className="ui-number-input" id={id}>
      <input
        disabled={disabled}
        name={name}
        onBlur={handleBlur}
        onChange={handleChange}
        required={required}
        type="text"
        value={`${value} ${unit ? (value > 1 ? unit?.plural : unit?.singular) : ""}`}
      />

      <NavButton
        buttonType="less"
        onClick={() => {
          if (value > minValue) {
            onChange?.(value - 1);
            setValue(value - 1);
          }
        }}
        size="s"
      />

      <NavButton
        buttonType="more"
        onClick={() => {
          if (value < maxValue) {
            onChange?.(value + 1);
            setValue(value + 1);
          }
        }}
        size="s"
      />
    </div>
  );
}
