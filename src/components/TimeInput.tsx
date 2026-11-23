import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import Toggle from "./Toggle";

type Meridian = "AM" | "PM";

interface TimeInputProps {
  defaultTime?: string;
  disabled?: boolean;
  id?: string;
  maxTime?: string;
  minTime?: string;
  name?: string;
  onChange?: (time: string) => void;
  required?: boolean;
}

export default function TimeInput({
  id,
  defaultTime = "00:00",
  disabled,
  name,
  onChange,
  required,
  minTime = "00:00",
  maxTime = "23:59",
}: TimeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [meridian, setMeridian] = useState<Meridian>(
    getAmPmTime(defaultTime).meridian
  );

  const timeAmPm = useMemo(() => {
    return getAmPmTime(defaultTime).time;
  }, [defaultTime]);

  // Get time
  function getAmPmTime(time: string) {
    let hours = Number(time.split(":")[0]);
    const minutes = time.split(":")[1];
    const meridian: Meridian = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    const formattedTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

    return {
      time: formattedTime,
      meridian,
    };
  }

  // Handle change
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    function get24HourTime(time: string) {
      const [hours, minutes] = time.split(":");
      let hour = Number(hours);
      // The time held to the limits, not the one typed: 09:00 held to a
      // 14:00 minimum is 14:00, not 02:00.
      const updatedMeridian = hour >= 12 ? "PM" : "AM";

      if (updatedMeridian === "PM" && hour < 12) {
        hour = hour + 12;
      }

      if (updatedMeridian === "AM" && hour >= 12) {
        hour = hour - 12;
      }

      return `${String(hour).padStart(2, "0")}:${minutes || "00"}`;
    }
    let value = e.target.value;

    //max min time validations
    if (Number(value.split(":")?.[0]) >= 12) {
      setMeridian("PM");
    }
    if (Number(value.split(":")?.[0]) < 12) {
      setMeridian("AM");
    }

    if (Number(value?.split(":")[0]) < Number(minTime.split(":")[0])) {
      value = minTime;
    }

    if (Number(value?.split(":")[0]) > Number(maxTime.split(":")[0])) {
      value = maxTime;
    }

    if (
      Number(value?.split(":")[0]) === Number(maxTime.split(":")[0]) &&
      Number(value?.split(":")[1]) > Number(maxTime.split(":")[1])
    ) {
      value = maxTime;
    }

    if (
      Number(value?.split(":")[0]) === Number(minTime.split(":")[0]) &&
      Number(value?.split(":")[1]) < Number(minTime.split(":")[1])
    ) {
      value = minTime;
    }

    onChange?.(get24HourTime(value));
  }

  useEffect(() => {
    if (defaultTime) {
      setMeridian(getAmPmTime(defaultTime).meridian);
    }
  }, [defaultTime]);

  // Handle meridian change
  function handleMeridianChange(meridian: Meridian) {
    setMeridian(meridian);

    const [hours, minutes] = timeAmPm.split(":");
    let hour = Number(hours);

    if (meridian === "PM" && hour < 12) {
      hour = hour + 12;
    }

    if (meridian === "AM" && hour >= 12) {
      hour = hour - 12;
    }

    const time24 = `${String(hour).padStart(2, "0")}:${minutes || "00"}`;

    onChange?.(time24);
  }

  // Render
  return (
    <div className="ui-time-input" id={id}>
      <input
        disabled={disabled}
        max={maxTime}
        min={minTime}
        name={name}
        onChange={handleChange}
        ref={inputRef}
        required={required}
        type="time"
        value={timeAmPm}
      />

      <Toggle
        defaultSelected={meridian === "AM" ? 0 : 1}
        defaultValue={meridian}
        disabled={disabled}
        options={[
          {
            label: "AM",
            onClick: () => handleMeridianChange("AM"),
          },
          {
            label: "PM",
            onClick: () => handleMeridianChange("PM"),
          },
        ]}
        size="s"
      />
    </div>
  );
}
