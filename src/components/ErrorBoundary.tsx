import type { ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

import { recordError } from "../utils/rum";

const FALLBACK_PADDING = 24;

interface Props {
  children: ReactNode;
  /** Headline shown in place of the app. */
  message?: string;
}

/**
 * Root boundary for the SPAs. Catches render errors, takes over the screen
 * with the fallback and reports the error to CloudWatch RUM.
 *
 * Event-handler and async errors are not caught here — RUM's `errors`
 * telemetry picks those up from `onerror` / `unhandledrejection`.
 */
export default function ErrorBoundary({
  children,
  message = "Something went wrong.",
}: Props) {
  return (
    <ReactErrorBoundary
      fallback={
        <div style={{ padding: FALLBACK_PADDING, textAlign: "center" }}>
          <h2>{message}</h2>
          <p>Please refresh the page or contact support.</p>
        </div>
      }
      onError={recordError}
    >
      {children}
    </ReactErrorBoundary>
  );
}
