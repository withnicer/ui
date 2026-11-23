import { useRef, useState } from "react";
import type { InputEvent, InputHTMLAttributes } from "react";

import Dropdown from "./Dropdown";
import type { DropdownOption } from "./Dropdown";
import Spinner from "./Spinner";
import TextInput from "./TextInput";

interface AutocompleteProps<T> extends InputHTMLAttributes<HTMLInputElement> {
  defaultOptions?: DropdownOption<T>[];
  icon?: string;
  inputValue?: string;
  isLoading?: boolean;
  label?: string;
  onInputChange?: (value: string) => void;
  onSelectOption?: (value?: T) => void;
  options: DropdownOption<T>[];
  required?: boolean;
  selectedOptions?: T[];
}

export default function Autocomplete<T>({
  label,
  options,
  onInputChange,
  onSelectOption,
  selectedOptions,
  inputValue,
  required,
  isLoading,
  onBlur,
  onFocus,
  defaultOptions,
  icon,
  ...rest
}: AutocompleteProps<T>) {
  const [dropdownShown, setDropdownShown] = useState<boolean>(false);
  const [defaultOptionsDropdownShown, setDefaultOptionsDropdownShown] =
    useState<boolean>(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  function handleInput(e: InputEvent<HTMLInputElement>) {
    const value = (e.target as HTMLInputElement).value;

    setDropdownShown(value.length >= 1);
    onInputChange?.(value);

    rest.onInput?.(e);
  }

  const handleSelectOption = (option?: T) => {
    if (!option) {
      return;
    }
    onSelectOption?.(option);

    if (!rest.multiple) {
      setDropdownShown(false);
      setDefaultOptionsDropdownShown(false);
    }
  };

  return (
    <div className="ui-autocomplete" ref={wrapperRef}>
      {/* Only our options: the browser's own history list opened over them
          and, hovered, repainted the field light even in dark mode. */}
      <TextInput
        autoComplete="off"
        label={label}
        value={inputValue}
        {...rest}
        icon={icon}
        onBlur={onBlur}
        onFocus={(e) => {
          if (!inputValue) {
            setDefaultOptionsDropdownShown(true);
          }
          onFocus?.(e);
        }}
        onInput={handleInput}
        required={required}
      />

      <Dropdown
        anchorEl={wrapperRef}
        onSelect={(value) => handleSelectOption(value)}
        options={
          options.length > 0
            ? options
            : [
                {
                  // The hint only while too little is typed to search: never
                  // over a search on its way.
                  label:
                    inputValue && inputValue.length < 3 && !isLoading
                      ? "Type 3 letters to search"
                      : isLoading
                        ? "Loading..."
                        : "No results",
                },
              ]
        }
        selectedOptions={selectedOptions}
        setVisible={setDropdownShown}
        visible={dropdownShown}
      />
      {!inputValue && defaultOptions?.length ? (
        <Dropdown
          anchorEl={wrapperRef}
          onSelect={(value) => handleSelectOption(value)}
          options={defaultOptions}
          selectedOptions={selectedOptions}
          setVisible={setDefaultOptionsDropdownShown}
          visible={defaultOptionsDropdownShown}
        />
      ) : null}

      {isLoading && <Spinner color="light" size={16} />}
    </div>
  );
}
