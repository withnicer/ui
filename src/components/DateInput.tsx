import { useState } from "react";

import Calendar from "./Calendar";
import Icon from "./Icon";

interface DateInputProps {
  defaultDate?: string;
  disabled?: boolean;
  id?: string;
  key?: string;
  label?: string;
  maxDate?: string;
  minDate?: string;
  name?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}

export default function DateInput({
  id,
  defaultDate,
  disabled,
  label,
  name,
  onChange,
  required,
  key,
  minDate,
  maxDate,
}: DateInputProps) {
  const [value, setValue] = useState<string>(defaultDate || "");
  const [open, setOpen] = useState<boolean>(false);

  // Open date picker
  function openDatePicker() {
    setOpen(true);
  }

  // Set date
  function setDate(from: string | null) {
    if (from) {
      setValue(from);
      onChange?.(from);
    }
  }

  // Render
  return (
    <div className="ui-date-input" id={id}>
      <input
        disabled={disabled}
        key={key}
        name={name}
        onFocus={openDatePicker}
        placeholder="Select date"
        required={required}
        type="text"
        value={value}
      />

      {label && <label>{label}</label>}

      <button onClick={openDatePicker} type="button">
        <Icon name="calendar" size={16} />
      </button>

      <Calendar
        defaultFrom={defaultDate}
        maxDate={maxDate}
        minDate={minDate}
        onChange={(value) => {
          setDate(value);
        }}
        setVisible={setOpen}
        visible={open}
      />
    </div>
  );
}
