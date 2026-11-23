import { type ChangeEvent, useEffect, useRef, useState } from "react";

interface PriceProps {
  /** Names the field when no visible label is tied to it. */
  "aria-label"?: string;
  currencySelector?: boolean;
  defaultCurrency?: string;
  defaultValue?: string;
  disabled?: boolean;
  id?: string;
  max?: number;
  min?: number;
  name?: string;
  onChange?: (value: string) => void;
  onCurrencyChange?: (curency: string) => void;
  options?: { label: string; value: string }[];
  required?: boolean;
}

export default function PriceInput({
  "aria-label": ariaLabel,
  id,
  options,
  currencySelector,
  defaultCurrency = "USD",
  defaultValue = "",
  disabled,
  name,
  onChange,
  onCurrencyChange,
  required,
  min,
  max,
}: PriceProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState<string>(defaultValue?.toString());

  useEffect(() => {
    setValue(defaultValue?.toString());
  }, [defaultValue]);

  const dropdownOptions = options || [
    { label: "USD", value: "USD" },
    { label: "EUR", value: "EUR" },
  ];

  // Handle change
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    let numericValue = Number(rawValue);

    if (min !== undefined) {
      numericValue = Math.max(min * 100, numericValue);
    }
    if (max !== undefined) {
      numericValue = Math.min(max * 100, numericValue);
    }

    const constrainedValue = numericValue.toString();

    setValue(constrainedValue);
    onChange?.(constrainedValue);
  }

  // Format
  function format(num: string): string {
    const numericValue = Number.parseFloat(num) / 100;

    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  }

  // Render
  return (
    <div className="ui-price-input" id={id}>
      <input
        aria-label={ariaLabel}
        disabled={disabled}
        name={name}
        onChange={handleChange}
        placeholder="0.00"
        ref={inputRef}
        required={required}
        type="text"
        value={value && format(value)}
      />

      {currencySelector ? (
        <select
          defaultValue={defaultCurrency}
          onChange={(e) => onCurrencyChange?.(e.currentTarget.value)}
        >
          {dropdownOptions?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <b>$</b>
      )}
    </div>
  );
}
