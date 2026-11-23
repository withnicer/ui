import {
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import dialCodes from "../utils/dial-codes.json";
import Dropdown from "./Dropdown";
import Icon from "./Icon";

export interface Phone {
  completeNumber: string;
  dialCode: string;
  number: string;
}

interface PhoneInputProps {
  /** The dial code a known number starts with, e.g. "+51"; else the visitor's. */
  defaultDialCode?: string;
  /** The national number, without its dial code. */
  defaultValue?: string;
  disabled?: boolean;
  /** Under the field, as TextInput shows one. */
  error?: string;
  id?: string;
  /**
   * Names the field on its top border, from the start: the dial code holds
   * the spot a TextInput's resting label would take. For two phone fields
   * side by side (a phone and a WhatsApp).
   */
  label?: string;
  name?: string;
  /** Focus left the field: the number and its dial code alike. */
  onBlur?: () => void;
  onChange?: (phone?: Phone) => void;
  /** What the empty number field shows; "Phone" by default. */
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
}

export default function PhoneInput({
  id,
  defaultDialCode,
  defaultValue,
  disabled,
  error,
  label,
  name,
  onBlur,
  onChange,
  placeholder = "Phone",
  required,
  readOnly,
}: PhoneInputProps) {
  const inputId = useId();
  // Dial code
  const [dialCode, setDialCode] = useState<string>(defaultDialCode ?? "+1");
  const [dropdownShown, setDropdownShown] = useState<boolean>(false);
  const selectedDialCode = useRef(Boolean(defaultDialCode));

  useEffect(() => {
    // A known number keeps its own dial code: no need to guess one.
    if (selectedDialCode.current) {
      return;
    }
    fetch("https://ipinfo.io/?token=84ffb9dd7cb5ff")
      .then((response) => response.json())
      .catch(() => {
        // Fail silently
      })
      .then((data) => {
        if (
          data?.city &&
          !selectedDialCode.current &&
          !inputRef.current?.value
        ) {
          const country = dialCodes.find((item) => item.code === data.country);
          if (country) {
            setDialCode(country.dial_code);
          }
        }
      })
      .catch(() => {
        // Fail silently
      });
  }, []);

  function openDropdown(e: MouseEvent) {
    e.stopPropagation();

    setDropdownShown(true);
  }

  function setDialCodeAndClose(dialCode: string) {
    selectedDialCode.current = true;
    setDialCode(dialCode);
    setDropdownShown(false);
    const number = inputRef.current?.value ?? "";
    onChange?.({ completeNumber: `${dialCode}${number}`, dialCode, number });
  }

  // Layout
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // The number starts after the dial code, measured whenever it changes
  // size: a field mounted hidden (a closed tab) measures once it shows.
  useEffect(() => {
    const input = inputRef.current;
    const button = buttonRef.current;
    if (!(input && button)) {
      return undefined;
    }
    const fit = () => {
      if (button.offsetWidth > 0) {
        input.style.paddingLeft = `${button.offsetWidth + 16}px`;
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(button);
    return () => observer.disconnect();
  }, [dialCode]);

  // Handle on change
  function handleChange(e: ChangeEvent) {
    const input = e.target as HTMLInputElement;
    const number = input.value;

    onChange?.({
      dialCode,
      number,
      completeNumber: dialCode.concat(number),
    });
  }

  // Handle on input
  function handleInput(e: FormEvent) {
    const input = e.target as HTMLInputElement;

    input.value = input.value.replace(/[^0-9]/g, "");
  }

  // Render
  return (
    <div
      className={label ? "ui-phone-input labelled" : "ui-phone-input"}
      id={id}
      // Moving between the number and the dial code stays inside the field.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onBlur?.();
        }
      }}
    >
      <input
        autoComplete="tel"
        defaultValue={defaultValue}
        disabled={disabled}
        id={inputId}
        inputMode="tel"
        // A national number runs to 14 digits under E.164's 15 (Brazil's
        // mobiles take 11, which 10 cut short).
        maxLength={14}
        name={name}
        onChange={handleChange}
        onInput={handleInput}
        placeholder={placeholder}
        readOnly={readOnly}
        ref={inputRef}
        required={required}
        type="tel"
      />

      <button
        disabled={disabled}
        onClick={openDropdown}
        ref={buttonRef}
        type="button"
      >
        {dialCode}

        <Icon name="misc-dropdown" size={8} />
      </button>

      <Dropdown
        onSelect={(value) => {
          if (value) {
            setDialCodeAndClose(value);
          }
        }}
        options={dialCodes.map((country) => ({
          label: `${country.flag} ${country.name} (${country.dial_code})`,
          value: country.dial_code,
        }))}
        setVisible={setDropdownShown}
        // Typing a country's name jumps to it, as the native picker does.
        typeAhead
        visible={dropdownShown}
      />

      {label ? <label htmlFor={inputId}>{label}</label> : null}

      {error ? (
        <div className="error">
          <Icon name="alert" size={12} />

          <p className="t-xxs">{error}</p>
        </div>
      ) : null}
    </div>
  );
}
