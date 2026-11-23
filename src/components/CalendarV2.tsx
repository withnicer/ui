import dayjs from "dayjs";
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Button from "./Button";
import NavButton from "./NavButton";
import Overlay from "./Overlay";

export interface CalendarPropsV2 {
  /**
   * A click on the picked day unpicks it (one day only, not a range): Done
   * then reads as no date.
   */
  clearable?: boolean;
  defaultFrom?: string;
  defaultTo?: string;
  double?: boolean;
  initialViewDate?: string;
  maxDate?: string;
  minDate?: string;
  onChange: (from: string | null, to: string | null) => void;
  /**
   * Done, and only Done: a click outside closes the calendar too, which a
   * host that applies the picked range on Done reads as leaving it be.
   */
  onDone?: () => void;
  setVisible: (state: boolean) => void;
  visible: boolean;
}

export const CalendarV2 = ({
  clearable,
  defaultFrom,
  defaultTo,
  double,
  initialViewDate,
  onChange,
  onDone,
  visible,
  setVisible,
  minDate,
  maxDate,
}: CalendarPropsV2) => {
  const weekdaysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthsMap = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const hasInitialized = useRef(false);
  const prevDefaultFrom = useRef<string | undefined>(undefined);
  const prevDefaultTo = useRef<string | undefined>(undefined);

  const initialDate = useMemo(() => {
    const base = initialViewDate ? dayjs(initialViewDate) : dayjs();
    return { year: base.year(), month: base.month() };
  }, []);

  const [year, setYear] = useState<number>(initialDate.year);
  const [month, setMonth] = useState<number>(initialDate.month);
  const [variant, setVariant] = useState<"days" | "months" | "years">("days");
  const [decadeStart, setDecadeStart] = useState<number>(
    Math.floor(initialDate.year / 10) * 10
  );

  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);

  useEffect(() => {
    const isFirstTimeFrom =
      !hasInitialized.current && defaultFrom && !prevDefaultFrom.current;
    const isFirstTimeTo =
      !hasInitialized.current && defaultTo && !prevDefaultTo.current;
    const defaultFromChanged = defaultFrom !== prevDefaultFrom.current;
    const defaultToChanged = defaultTo !== prevDefaultTo.current;

    if (
      isFirstTimeFrom ||
      isFirstTimeTo ||
      (!hasInitialized.current && (defaultFromChanged || defaultToChanged))
    ) {
      const newFrom = defaultFrom || null;
      const newTo = defaultTo || null;

      setFrom(newFrom);
      setTo(newTo);

      if (defaultFrom && !hasInitialized.current) {
        const date = dayjs(defaultFrom);
        setYear(date.year());
        setMonth(date.month());
      }

      hasInitialized.current = true;
    }

    prevDefaultFrom.current = defaultFrom;
    prevDefaultTo.current = defaultTo;
  }, [defaultFrom, defaultTo]);

  const firstDayOfMonth = useMemo(
    () => dayjs(new Date(year, month, 1)).day(),
    [year, month]
  );

  const daysInMonth = useMemo(
    () => dayjs(new Date(year, month, 1)).daysInMonth(),
    [year, month]
  );

  const prev = useCallback(() => {
    if (variant === "days") {
      if (month > 0) {
        setMonth(month - 1);
      } else {
        setMonth(11);
        setYear(year - 1);
      }
    } else if (variant === "months") {
      setYear(year - 1);
    } else {
      setDecadeStart(decadeStart - 10);
    }
  }, [variant, month, year, decadeStart]);

  const next = useCallback(() => {
    if (variant === "days") {
      if (month < 11) {
        setMonth(month + 1);
      } else {
        setMonth(0);
        setYear(year + 1);
      }
    } else if (variant === "months") {
      setYear(year + 1);
    } else {
      setDecadeStart(decadeStart + 10);
    }
  }, [variant, month, year, decadeStart]);

  const select = useCallback(
    (date: string) => {
      let newFrom = from;
      let newTo = to;

      if (!from) {
        newFrom = date;
        newTo = null;
      } else if (double) {
        if (to) {
          newFrom = date;
          newTo = null;
        } else if (dayjs(date).isAfter(dayjs(from))) {
          newTo = date;
        } else {
          newTo = from;
          newFrom = date;
        }
      } else if (clearable && date === dayjs(from).format("YYYY-MM-DD")) {
        newFrom = null;
        newTo = null;
      } else {
        newFrom = date;
        newTo = null;
      }

      setFrom(newFrom);
      setTo(newTo);

      onChange(newFrom, newTo);
    },
    [clearable, from, to, double, onChange]
  );

  useEffect(() => {
    if (hasInitialized.current && prevDefaultFrom.current && !from && !to) {
      onChange(prevDefaultFrom.current || null, prevDefaultTo.current || null);
    }
  }, [hasInitialized.current]);

  const toggleVariant = useCallback(() => {
    if (variant === "days") {
      setVariant("months");
    } else if (variant === "months") {
      setVariant("years");
    } else {
      setVariant("days");
    }
  }, [variant]);

  const selectMonth = useCallback((monthIndex: number) => {
    setMonth(monthIndex);
    setVariant("days");
  }, []);

  const selectYear = useCallback((selectedYear: number) => {
    setYear(selectedYear);
    setVariant("months");
  }, []);

  const confirm = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      setVisible(false);
    },
    [setVisible]
  );

  const done = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      onDone?.();
      setVisible(false);
    },
    [onDone, setVisible]
  );

  const backToDays = useCallback(() => {
    setVariant("days");
  }, []);

  const headerTitle = useMemo(() => {
    if (variant === "days") {
      return dayjs().year(year).month(month).format("MMMM YYYY");
    }
    if (variant === "months") {
      return year.toString();
    }
    return `${decadeStart}–${decadeStart + 10}`;
  }, [variant, year, month, decadeStart]);

  const isDateOutOfRange = useCallback(
    (date: dayjs.Dayjs) => {
      if (minDate && date.isBefore(dayjs(minDate), "day")) {
        return true;
      }
      if (maxDate && date.isAfter(dayjs(maxDate), "day")) {
        return true;
      }
      return false;
    },
    [minDate, maxDate]
  );

  if (!visible) {
    return null;
  }

  return (
    <Overlay onClick={confirm}>
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- propagation guard so clicks inside the panel do not reach the backdrop dismiss; it is not a control. */}
      <div className="ui-calendar" onClick={(e) => e.stopPropagation()}>
        <div>
          <NavButton buttonType="back" onClick={prev} size="l" />
          <p
            onClick={toggleVariant}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleVariant();
              }
            }}
            role="button"
            tabIndex={0}
          >
            {headerTitle}
          </p>
          <NavButton buttonType="forward" onClick={next} size="l" />
        </div>

        {variant === "days" ? (
          <div className="days">
            <div>
              {weekdaysMap.map((day: string, i: number) => (
                <p key={i}>{day}</p>
              ))}
            </div>

            <div>
              {Array.from({ length: 6 * 7 }).map((_, i) => {
                const slot = i + 1 - firstDayOfMonth;
                const day = slot > 0 && slot <= daysInMonth ? slot : null;

                if (!day) {
                  return (
                    <button
                      aria-label="Empty calendar cell"
                      disabled
                      key={i}
                      type="button"
                    />
                  );
                }

                const date = dayjs().year(year).month(month).date(day);
                const formattedDate = date.format("YYYY-MM-DD");
                const isToday = dayjs().isSame(date, "day");
                const isFrom =
                  from && formattedDate === dayjs(from).format("YYYY-MM-DD");
                const isTo =
                  to && formattedDate === dayjs(to).format("YYYY-MM-DD");
                const isBetween =
                  from &&
                  to &&
                  date.isAfter(dayjs(from), "day") &&
                  date.isBefore(dayjs(to), "day");
                const isOutOfRange = isDateOutOfRange(date);
                const isDisabled =
                  isOutOfRange ||
                  (double &&
                    from &&
                    !to &&
                    formattedDate === dayjs(from).format("YYYY-MM-DD"));

                return (
                  <button
                    className={`${isToday ? "today" : ""} ${isFrom || isTo ? "selected" : isBetween ? "between" : ""}`}
                    disabled={Boolean(isDisabled)}
                    key={i}
                    onClick={() => select(formattedDate)}
                    type="button"
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        ) : variant === "months" ? (
          <div className="months">
            {monthsMap.map((monthName, i) => (
              <p
                className={`t-xxs ${month === i ? "active" : ""}`}
                key={i}
                onClick={() => selectMonth(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectMonth(i);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {monthName}
              </p>
            ))}
          </div>
        ) : (
          <div className="years">
            {Array.from({ length: 11 }).map((_, i) => {
              const itemYear = decadeStart + i;

              return (
                <p
                  className={`t-xxs ${year === itemYear ? "active" : ""}`}
                  key={i}
                  onClick={() => selectYear(itemYear)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectYear(itemYear);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {itemYear}
                </p>
              );
            })}
          </div>
        )}

        {variant === "days" ? (
          <Button buttonType="primary" label="Done" onClick={done} size="m" />
        ) : (
          <Button
            buttonType="tertiary"
            label="Back"
            onClick={backToDays}
            size="m"
          />
        )}
      </div>
    </Overlay>
  );
};
