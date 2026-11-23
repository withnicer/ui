import { useState } from "react";

export interface AgencyMarkProps {
  /** The agency's logo; without one, or when it fails to load, its initial. */
  logoUrl?: string;
  /** The agency's name, whose first letter stands in for the logo. */
  name: string;
  /**
   * 24px (`s`), 32px (`m`, the default), or the whole of a tile the host
   * frames (`fill`), as a detail page's 64px one.
   */
  size?: "fill" | "m" | "s";
}

const INITIAL_TYPE = { fill: "t-l", m: "t-xs", s: "t-xxs" } as const;

/**
 * An agency's mark: its logo over a neutral tile holding its initial. The
 * logo shows once it has loaded, so a broken or missing one leaves the
 * initial instead of the browser's broken image; never Nicer's own mark.
 */
export default function AgencyMark({
  logoUrl,
  name,
  size = "m",
}: AgencyMarkProps) {
  // The logo that loaded, and the one that failed: a new logo starts over.
  const [loaded, setLoaded] = useState<string>();
  const [failed, setFailed] = useState<string>();
  const initial = (name.trim()[0] ?? "?").toUpperCase();

  return (
    <span className={`ui-agency-mark ${size}`}>
      <span aria-hidden="true" className={`initial ${INITIAL_TYPE[size]}`}>
        {initial}
      </span>
      {logoUrl && failed !== logoUrl ? (
        <img
          alt=""
          className={loaded === logoUrl ? "loaded" : undefined}
          onError={() => setFailed(logoUrl)}
          onLoad={() => setLoaded(logoUrl)}
          src={logoUrl}
        />
      ) : null}
    </span>
  );
}
