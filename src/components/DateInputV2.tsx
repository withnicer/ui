import { useId } from "react";
import type { Dispatch, InputHTMLAttributes, SetStateAction } from "react";

import { formatDate } from "../utils/dates";
import Icon from "./Icon";

export interface DateInputV2Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  setCalendarVisible: Dispatch<SetStateAction<boolean>>;
}

export const DateInputV2 = ({
  label,
  setCalendarVisible,
  ...rest
}: DateInputV2Props) => {
  const generatedId = useId();
  const inputId = rest.id ?? generatedId;
  return (
    <div className="ui-date-input">
      <input
        id={inputId}
        disabled={rest.disabled}
        readOnly
        onClick={() => {
          if (!rest.disabled) {
            setCalendarVisible(true);
          }
        }}
        onKeyDown={(event) => {
          if (!rest.disabled && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            setCalendarVisible(true);
          }
        }}
        placeholder="Select date"
        required={rest.required}
        type="text"
        value={
          rest.value === null ||
          rest.value === "null" ||
          rest.value === "" ||
          rest.value === undefined
            ? ""
            : formatDate(rest.value as string)
        }
      />

      {label && <label htmlFor={inputId}>{label}</label>}

      <button
        aria-label={label ? `Choose ${label.toLowerCase()}` : "Choose date"}
        disabled={rest.disabled}
        onClick={() => setCalendarVisible(true)}
        type="button"
      >
        <Icon name="calendar" size={16} />
      </button>
    </div>
  );
};
