import type { InputHTMLAttributes } from "react";

interface RadioButtonProps extends InputHTMLAttributes<HTMLInputElement> {}

export default function RadioButton({ ...rest }: RadioButtonProps) {
  return (
    <div className="ui-radio-button">
      <input type="radio" {...rest} />

      <figure />
    </div>
  );
}
