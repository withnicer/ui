import { useId } from "react";
import type { InputHTMLAttributes } from "react";

import Icon from "./Icon";
import Spinner from "./Spinner";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: string;
  isLoading?: boolean;
  label?: string;
}

export default function TextInput({
  icon,
  id,
  isLoading,
  label,
  error,
  ...rest
}: TextInputProps) {
  // The label names its field for assistive technology and getByLabelText.
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={`ui-text-input ${icon ? "icon" : ""}`}>
      <input
        id={inputId}
        placeholder=" " // Don't remove
        type="text"
        {...rest}
      />

      {label && <label htmlFor={inputId}>{label}</label>}

      {icon && <Icon name={icon} size={16} />}

      {isLoading && <Spinner color="light" size={16} />}

      {error && (
        <div className="error">
          <Icon name="alert" size={12} />

          <p className="t-xxs">{error}</p>
        </div>
      )}
    </div>
  );
}
