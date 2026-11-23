import {
  type ChangeEvent,
  type TextareaHTMLAttributes,
  useEffect,
  useState,
} from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export default function TextArea({
  label,
  defaultValue,
  ...rest
}: TextAreaProps) {
  const [text, setText] = useState<string>("");

  useEffect(() => {
    setText(defaultValue?.toString() || "");
  }, [defaultValue]);

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);

    rest.onChange?.(e);
  }

  // Render
  return (
    <div className="ui-text-area">
      <textarea
        className={text.length > 0 ? "filled" : undefined}
        placeholder=" " // Don't remove
        {...rest}
        onChange={handleChange}
      />

      {label && <label>{label}</label>}
    </div>
  );
}
