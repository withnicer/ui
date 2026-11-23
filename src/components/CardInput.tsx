import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

import cards from "../utils/cards";
import type { CardBrand } from "../utils/cards";

interface CardInputValues {
  brand?: CardBrand;
  cvv?: string | null;
  date?: string | null;
  number?: string | null;
}

export interface CardInputProps {
  data?: CardInputValues;
  disabled?: boolean;
  includeCvv?: boolean;
  setData?: (data: CardInputValues) => void;
}

function cardBrand(cleaned: string): CardBrand {
  if (/^4[0-9]{0,15}$/.test(cleaned)) {
    return "visa";
  }
  if (
    /^(5[1-5][0-9]{0,14}|2(2[2-9][0-9]{0,12}|[3-6][0-9]{0,13}|7[01][0-9]{0,13}|720[0-9]{0,12}))$/.test(
      cleaned
    )
  ) {
    return "mastercard";
  }
  if (/^3[47][0-9]{0,13}$/.test(cleaned)) {
    return "amex";
  }
  if (
    /^(6011|65|64[4-9]|622(1(2[6-9]|[3-9][0-9])|[2-8][0-9]{0,2}|9([01][0-9]|2[0-5])))[0-9]{0,12}$/.test(
      cleaned
    )
  ) {
    return "discover";
  }
  return "unknown";
}

const CardInput = ({
  data,
  setData,
  disabled,
  includeCvv = true,
}: CardInputProps) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const cvvInputRef = useRef<HTMLInputElement>(null);
  const [focus, setFocus] = useState<boolean>(false);

  // Format number
  const [number, setNumber] = useState<string>(data?.number || "");

  const brand = cardBrand(number.replace(/\s+/g, ""));

  function formatNumber(e: ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    const cleaned = text.replace(/\D/g, "");
    const formattedNumber = cleaned.replace(/(.{4})/g, "$1 ").trim();

    setNumber(formattedNumber);

    setData?.({ ...data, number: cleaned, brand: cardBrand(cleaned) });

    if (formattedNumber.length === 19) {
      dateInputRef.current?.focus();
    }
  }

  // Format date
  const [date, setDate] = useState<string>(data?.date || "");

  function formatDate(e: ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    const cleaned = text.replace(/\D/g, "");
    let formattedDate = cleaned;

    if (cleaned.length >= 3) {
      formattedDate = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }

    setDate(formattedDate);

    setData?.({ ...data, brand, date: formattedDate });

    if (includeCvv && formattedDate.length === 5) {
      cvvInputRef.current?.focus();
    }
  }

  // Render
  return (
    <div
      className={`ui-card-input ${focus ? "focus" : ""} ${disabled ? "disabled" : ""} ${includeCvv ? "" : "without-cvv"}`}
    >
      <img alt="" src={cards[brand]} />

      <input
        className="mp-mask"
        maxLength={19}
        onBlur={() => setFocus(false)}
        onChange={formatNumber}
        onFocus={() => setFocus(true)}
        placeholder="Card number"
        type="text"
        value={number}
      />

      <input
        className="mp-mask"
        maxLength={5}
        onBlur={() => setFocus(false)}
        onChange={formatDate}
        onFocus={() => setFocus(true)}
        placeholder="MM/YY"
        ref={dateInputRef}
        type="text"
        value={date === "/" ? "" : date}
      />

      {includeCvv ? (
        <input
          className="mp-mask"
          maxLength={4}
          onBlur={() => setFocus(false)}
          onChange={(e) => {
            const text = e.target.value;
            setData?.({ ...data, brand, cvv: text });
          }}
          onFocus={() => setFocus(true)}
          placeholder="CVV"
          ref={cvvInputRef}
          type="text"
          value={data?.cvv || ""}
        />
      ) : null}
    </div>
  );
};

export default CardInput;
