import { type MouseEvent, useEffect, useState } from "react";

import Button from "./Button";
import NavButton from "./NavButton";
import Overlay from "./Overlay";

interface CalendarProps {
  defaultFrom?: string;
  defaultTo?: string;
  double?: boolean;
  maxDate?: string;
  minDate?: string;
  onChange: (from: string | null, to: string | null) => void;
  setVisible: (state: boolean) => void;
  visible: boolean;
}

export default function Calendar({
  defaultFrom,
  defaultTo,
  double,
  onChange,
  visible,
  setVisible,
  minDate,
  maxDate,
}: CalendarProps) {
  const weekdaysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // Midnight, so today is never one of the days already gone.
  const now = new Date(new Date().setHours(0, 0, 0, 0));
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth());
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Navigation
  function prevMonth() {
    if (month > 0) {
      setMonth(month - 1);
    } else {
      setMonth(11);
      setYear(year - 1);
    }
  }

  function nextMonth() {
    if (month < 11) {
      setMonth(month + 1);
    } else {
      setMonth(0);
      setYear(year + 1);
    }
  }

  // Select
  const [from, setFrom] = useState<string | null>(defaultFrom || null);
  const [to, setTo] = useState<string | null>(defaultTo || null);

  function select(date: string) {
    if (!from) {
      setFrom(date);
    } else if (double) {
      if (to) {
        setFrom(date);
        setTo(null);
      } else if (new Date(date) > new Date(from)) {
        setTo(date);
      } else {
        setTo(from);
        setFrom(date);
      }
    } else {
      setFrom(date);
      setTo(null);
    }
  }

  // Handle on change
  useEffect(() => {
    onChange(from, to);
  }, [from, to]);

  // Default date
  useEffect(() => {
    if (defaultFrom) {
      const date = new Date(defaultFrom);

      setYear(date.getFullYear());
      setMonth(date.getMonth());
    }
  }, []);

  // Confirm
  function confirm(e: MouseEvent<HTMLElement>) {
    e.stopPropagation();

    setVisible(false);
  }

  // Render
  return (
    visible && (
      <Overlay onClick={confirm}>
        {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- propagation guard so clicks inside the panel do not reach the backdrop dismiss; it is not a control. */}
        <div className="ui-calendar" onClick={(e) => e.stopPropagation()}>
          <div>
            <NavButton buttonType="back" onClick={prevMonth} size="l" />

            <p>
              {new Date(year, month).toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>

            <NavButton buttonType="forward" onClick={nextMonth} size="l" />
          </div>

          <div>
            <div>
              {weekdaysMap.map((day: string, i: number) => (
                <p key={i}>{day}</p>
              ))}
            </div>

            <div>
              {Array.from({ length: 6 * 7 }).map((_, i) => {
                const slot = i + 1 - firstDayOfMonth;
                const day = slot > 0 && slot <= daysInMonth ? slot : null;
                const date = day ? new Date(year, month, day) : null;
                const formattedDate = date?.toISOString().slice(0, 10);
                const isPast = date && date < now;
                const isToday = date?.getTime() === now.setHours(0, 0, 0, 0);
                const isFrom = from && formattedDate === from;
                const isTo = to && formattedDate === to;
                const isBetween =
                  from &&
                  to &&
                  date &&
                  new Date(from) < date &&
                  date < new Date(to);
                const isOutOfRange =
                  (minDate && date && date < new Date(minDate)) ||
                  (maxDate && date && date > new Date(maxDate));

                return (
                  <button
                    className={`${isToday ? "today" : ""} ${isFrom || isTo ? "selected" : isBetween ? "between" : ""}`}
                    disabled={!day || (isPast as boolean) || !!isOutOfRange}
                    key={i}
                    onClick={() => formattedDate && select(formattedDate)}
                    type="button"
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            buttonType="secondary"
            label="Done"
            onClick={confirm}
            size="m"
          />
        </div>
      </Overlay>
    )
  );
}
