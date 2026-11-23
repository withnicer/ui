import amex from "../assets/cards/amex.svg";
import applePay from "../assets/cards/apple-pay.svg";
import cartes_bancaires from "../assets/cards/cartes-bancaires.svg";
import diners from "../assets/cards/diners.svg";
import discover from "../assets/cards/discover.svg";
import eftpos_au from "../assets/cards/eftpos.svg";
import googlePay from "../assets/cards/google-pay.svg";
import hiper from "../assets/cards/hiper.svg";
import hipercard from "../assets/cards/hipercard.svg";
import interac from "../assets/cards/interac.svg";
import jcb from "../assets/cards/jcb.svg";
import maestro from "../assets/cards/maestro.svg";
import mastercard from "../assets/cards/mastercard.svg";
import unionpay from "../assets/cards/unionpay.svg";
import unknown from "../assets/cards/unknown.svg";
import visa from "../assets/cards/visa.svg";

export type CardBrand =
  | "amex"
  | "applePay"
  | "cartes_bancaires"
  | "diners"
  | "discover"
  | "eftpos_au"
  | "googlePay"
  | "hiper"
  | "hipercard"
  | "interac"
  | "jcb"
  | "maestro"
  | "mastercard"
  | "unionpay"
  | "unknown"
  | "visa";

const cards: Record<CardBrand, string> = {
  amex,
  applePay,
  cartes_bancaires,
  diners,
  discover,
  eftpos_au,
  googlePay,
  hiper,
  hipercard,
  interac,
  jcb,
  maestro,
  mastercard,
  unionpay,
  unknown,
  visa,
};

export default cards;
