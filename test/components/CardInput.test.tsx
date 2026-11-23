// @vitest-environment jsdom
import { useState } from "react";
import { expect, it, vi } from "vite-plus/test";

import CardInput from "../../src/components/CardInput";
import type { CardInputProps } from "../../src/components/CardInput";
import { change, getByPlaceholderText, render } from "../support/render";

type Card = NonNullable<CardInputProps["data"]>;

/** A host that keeps what the field reports, as a checkout form does. */
function Checkout({
  includeCvv,
  onCard,
}: {
  includeCvv?: boolean;
  onCard: (card: Card) => void;
}) {
  const [card, setCard] = useState<Card>({});
  return (
    <CardInput
      data={card}
      includeCvv={includeCvv}
      setData={(next) => {
        setCard(next);
        onCard(next);
      }}
    />
  );
}

const fill = (props: { includeCvv?: boolean } = {}) => {
  const onCard = vi.fn<(card: Card) => void>();
  render(<Checkout {...props} onCard={onCard} />);
  return { lastCard: () => onCard.mock.lastCall?.[0], onCard };
};

const number = () => getByPlaceholderText("Card number");
const expiry = () => getByPlaceholderText("MM/YY");

it("groups the number in fours and reports its digits only", () => {
  const { lastCard } = fill();

  change(number(), "4242-4242 4242x4242");

  expect(number().value).toBe("4242 4242 4242 4242");
  expect(lastCard()).toEqual({ brand: "visa", number: "4242424242424242" });
});

it.each([
  ["4111", "visa"],
  ["5105", "mastercard"],
  ["2221", "mastercard"],
  ["2720", "mastercard"],
  ["3714", "amex"],
  ["3400", "amex"],
  ["6011", "discover"],
  ["6500", "discover"],
  ["6445", "discover"],
  ["622126", "discover"],
  ["622925", "discover"],
  ["2721", "unknown"],
  ["5600", "unknown"],
  ["3500", "unknown"],
])("tells a number starting %s is %s", (digits, brand) => {
  const { lastCard } = fill();

  change(number(), digits);

  expect(lastCard()?.brand).toBe(brand);
});

it("moves on to the expiry once the number is complete", () => {
  fill();
  number().focus();

  change(number(), "424242424242424");
  expect(document.activeElement).toBe(number());

  change(number(), "4242424242424242");
  expect(document.activeElement).toBe(expiry());
});

it.each([
  ["1", "1"],
  ["12", "12"],
  ["122", "12/2"],
  ["1229", "12/29"],
  ["12/29", "12/29"],
])("writes an expiry typed as %s as %s", (typed, shown) => {
  const { lastCard } = fill();

  change(expiry(), typed);

  expect(expiry().value).toBe(shown);
  expect(lastCard()?.date).toBe(shown);
});

it("moves on to the CVV once the expiry is complete, and reports the CVV", () => {
  const { lastCard } = fill();
  expiry().focus();

  change(expiry(), "1229");
  expect(document.activeElement).toBe(getByPlaceholderText("CVV"));

  change(getByPlaceholderText("CVV"), "123");
  expect(lastCard()).toMatchObject({ cvv: "123", date: "12/29" });
});

it("asks for no CVV when the payment does not need one", () => {
  fill({ includeCvv: false });
  expiry().focus();

  change(expiry(), "1229");

  expect(document.body.querySelector("[placeholder='CVV']")).toBeNull();
  expect(document.activeElement).toBe(expiry());
});
