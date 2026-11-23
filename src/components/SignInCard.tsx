import { useEffect } from "react";
import type { FormEvent, ReactNode } from "react";

import AgencyMark from "./AgencyMark";
import Button from "./Button";
import PhoneInput from "./PhoneInput";
import type { Phone } from "./PhoneInput";
import TextInput from "./TextInput";

export type SignInMethod = "email" | "phone";
export type SignInStep = "code" | "contact";

export interface SignInCardProps {
  /**
   * The agency whose own host this is (`portal.agency.com`): the screen
   * welcomes to it and wears its mark and sign-in photo in place of Nicer's.
   * Nicer's terms still govern, so the terms line names Nicer.
   */
  agency?: { logoUrl?: string; name: string; photoUrl?: string };
  /** A code is being asked for or checked: the button waits. */
  busy?: boolean;
  /** The CAPTCHA widget the host's sign-in renders under the fields. */
  captcha?: ReactNode;
  /** More links of the code step, after Resend code: another channel. */
  codeLinks?: ReactNode;
  /** The card's top right corner: the portal's Register link. */
  corner?: ReactNode;
  email: string;
  /** The square Nicer mark for the app's theme. */
  logoSrc: string;
  method: SignInMethod;
  /** Back to the contact step, to type another phone or email. */
  onChangeContact: () => void;
  /** The digits typed so far; anything else is dropped as it is typed. */
  onCode: (code: string) => void;
  onEmail: (email: string) => void;
  onMethod: (method: SignInMethod) => void;
  onPhone: (phone?: Phone) => void;
  onResend: () => void;
  /** Continue on the contact step, Sign in on the code step. */
  onSubmit: () => void;
  step: SignInStep;
  /** The drawn wordmark a phone shows in the upper half of the screen. */
  wordmarkSrc: string;
}

/** The length of the code the sign-in sends. */
export const SIGN_IN_CODE_LENGTH = 6;

const TERMS_URL = "https://nicer.travel/terms.pdf";
const CODE_INPUT_ID = "code-input";

/**
 * Sign-in for the apps Nicer's own people use (portal and Octopus): the card
 * inside the brand photo on a desktop, the native app's plain screen on a
 * phone. The host owns the challenge and what follows it; this owns the
 * screen, so every app signs in on the same one.
 */
export default function SignInCard({
  agency,
  busy,
  captcha,
  codeLinks,
  corner,
  email,
  logoSrc,
  method,
  onChangeContact,
  onCode,
  onEmail,
  onMethod,
  onPhone,
  onResend,
  onSubmit,
  step,
  wordmarkSrc,
}: SignInCardProps) {
  const onCodeStep = step === "code";

  useEffect(() => {
    if (onCodeStep) {
      document.getElementById(CODE_INPUT_ID)?.focus();
    }
  }, [onCodeStep]);

  const handleCode = (event: FormEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    input.value = input.value.replace(/[^0-9]/g, "");
    onCode(input.value);
  };

  return (
    <form
      className="ui-sign-in"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div
        className="frame"
        style={
          agency?.photoUrl
            ? { backgroundImage: `url(${JSON.stringify(agency.photoUrl)})` }
            : undefined
        }
      >
        <div className={onCodeStep ? "card code-step" : "card"}>
          {corner ? <div className="corner t-xxs">{corner}</div> : null}

          {agency ? (
            <span aria-label={agency.name} className="logo agency" role="img">
              <AgencyMark
                logoUrl={agency.logoUrl}
                name={agency.name}
                size="fill"
              />
            </span>
          ) : (
            <img alt="Nicer" className="logo" src={logoSrc} />
          )}
          <h1 className="t-m">Welcome to {agency ? agency.name : "nicer"}.</h1>

          <div className="wordmark">
            {agency ? (
              <span className="t-l">{agency.name}</span>
            ) : (
              <img alt="nicer" src={wordmarkSrc} />
            )}
          </div>

          {/* Each field keyed: the code never opens on the email or phone
              typed before, whether or not the host's router mounts the
              screen again for the code step. */}
          <div className="contact">
            {onCodeStep ? (
              <TextInput
                key="code"
                aria-label="6-digit code"
                autoComplete="one-time-code"
                id={CODE_INPUT_ID}
                inputMode="numeric"
                maxLength={SIGN_IN_CODE_LENGTH}
                onInput={handleCode}
                placeholder="6-digit code"
              />
            ) : method === "phone" ? (
              <PhoneInput key="phone" onChange={onPhone} />
            ) : (
              <TextInput
                key="email"
                aria-label="Email"
                autoComplete="email"
                onChange={(event) => onEmail(event.target.value)}
                placeholder="Email"
                type="email"
                value={email}
              />
            )}
          </div>

          {captcha}

          <div className="links">
            {onCodeStep ? (
              <>
                <button className="t-xxs" onClick={onResend} type="button">
                  Resend code
                </button>
                {codeLinks}
                <button
                  className="t-xxs"
                  onClick={onChangeContact}
                  type="button"
                >
                  Change {method}
                </button>
              </>
            ) : (
              <button
                className="t-xxs"
                onClick={() => onMethod(method === "phone" ? "email" : "phone")}
                type="button"
              >
                Sign in with {method === "phone" ? "email" : "phone"}
              </button>
            )}
          </div>

          <p className="t-xxxs terms">
            {/* One inline run: on a phone the paragraph is a flex box, and
                bare text and the link would become separate items. */}
            <span>
              {agency
                ? "By continuing you accept Nicer's "
                : "By using Nicer you accept our "}
              <a href={TERMS_URL} rel="noopener noreferrer" target="_blank">
                Terms &amp; Conditions
              </a>
            </span>
          </p>

          <Button
            buttonType="primary"
            label={onCodeStep ? "Sign in" : "Continue"}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                // Or the button's own Enter submits the form a second time.
                event.preventDefault();
                onSubmit();
              }
            }}
            size="m"
            state={busy ? "loading" : undefined}
            type="submit"
          />
        </div>
      </div>
    </form>
  );
}
