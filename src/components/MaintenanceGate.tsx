import { type ReactNode, useEffect, useState } from "react";

/** Frequent enough to lift the curtain minutes after ops flips the flag off. */
const POLL_MS = 60_000;

interface Props {
  /** The app's API origin (VITE_APP_API_URL). Empty disables the gate. */
  apiUrl: string;
  /** This deployment protects config reads with Cognito. Guests skip the gate. */
  getToken?: () => Promise<string | null | void>;
  children: ReactNode;
}

/**
 * The web twin of the native app's version gate: a kill switch for deploys.
 *
 * Reads authenticated `GET /config/AppVersion/web` — the same config resource
 * the native app checks at cold start — and takes over the screen while its
 * `isUnderMaintenance` flag is on. Ops flips the flag with the admin
 * `POST /config/AppVersion` (versionCode "web"); no frontend deploy involved.
 *
 * Fails OPEN, like the native gate: a network error, a missing row or an
 * unexpected payload renders the app normally. Being unable to read the flag
 * must never take the product down. While mounted it keeps polling, so
 * browsers left open drop into (and come back out of) maintenance on their
 * own.
 */
export default function MaintenanceGate({ apiUrl, children, getToken }: Props) {
  const [underMaintenance, setUnderMaintenance] = useState(false);

  useEffect(() => {
    if (!apiUrl) {
      return;
    }
    let cancelled = false;

    const check = async () => {
      try {
        const token = await getToken?.();
        if (getToken && !token) return;
        const response = await fetch(
          `${apiUrl.replace(/\/+$/, "")}/config/AppVersion/web`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        if (!response.ok) {
          return;
        }
        const data: unknown = await response.json();
        const flag =
          typeof data === "object" &&
          data !== null &&
          "isUnderMaintenance" in data &&
          typeof data.isUnderMaintenance === "boolean"
            ? data.isUnderMaintenance
            : false;
        if (!cancelled) {
          setUnderMaintenance(flag);
        }
      } catch {
        /* Fail open — never block the app on a config read. */
      }
    };

    void check();
    const timer = setInterval(() => void check(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [apiUrl, getToken]);

  if (!underMaintenance) {
    return <>{children}</>;
  }

  return (
    <main className="ui-maintenance" role="status">
      <p className="brand wordmark">nicer.</p>
      <h1 className="t-m">We&rsquo;ll be right back</h1>
      <p className="t-xs">
        We&rsquo;re making some improvements to Nicer. This usually takes a few
        minutes — the page will come back on its own, no need to refresh.
      </p>
    </main>
  );
}
