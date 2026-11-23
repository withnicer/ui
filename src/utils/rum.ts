import { AwsRum, type AwsRumConfig } from "aws-rum-web";
import { portalRumFetch } from "./rum-portal";

/**
 * Only the Nicer API. `addXRayTraceIdHeader` makes the RUM client attach
 * `X-Amzn-Trace-Id` to every matching request; a third party (Stripe,
 * Mixpanel, Intercom) does not list that header in its
 * `Access-Control-Allow-Headers`, so its preflight would fail and the call
 * would never leave the browser. RUM tests the URL exactly as passed to
 * `fetch`, unresolved, so the same-origin `/api/` path that Amplify rewrites
 * to the API needs its own pattern; without it, portal API failures never
 * reached RUM as http events.
 */
const API_URL_PATTERNS = [
  /^https:\/\/api(\.dev|\.stage)?\.nicer\.travel\//,
  /^\/api\//,
  // The agent chat answers from a Lambda function URL instead of the API
  // domain, so it needs its own pattern or it stays the one call with no link
  // between the browser session and the Lambda span. Checked before widening
  // this: the chat URL now allows `x-amzn-trace-id` (services/support/agent)
  // and the `/ai` function URL allows `*`, so no preflight starts failing. A
  // function URL that does not allow the header would break at the preflight.
  /^https:\/\/[a-z0-9]+\.lambda-url\.us-east-1\.on\.aws\//,
];

const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1"];
const RUM_REGION = "us-east-1";
const RUM_ENDPOINT = "https://dataplane.rum.us-east-1.amazonaws.com";
const FULL_SAMPLE_RATE = 1;

type SessionAttributes = Record<string, string | number | boolean | undefined>;

let client: AwsRum | undefined;
let sensitiveSurface = false;

/**
 * What the errors plugin must not report. Every entry paged david@ in dev
 * without a bug behind it:
 * - AbortError: leaving a screen cancels its open requests (LodgingDetail,
 *   LodgingSearchView, every `useEffect` cleanup with an AbortController).
 * - ResizeObserver loop: Chrome's own "you resized during layout" notice,
 *   harmless and unfixable from app code.
 * - "Script error." with no error object: a cross-origin script (an
 *   extension, a widget) failed and the browser hides everything about it.
 * - A stack inside a browser extension.
 * - vite:preloadError: a tab from an older release asked for a chunk that no
 *   longer exists; `recoverStaleAssets` reloads it.
 * - react-dnd's "Cannot call hover while not dragging.": the HTML5 backend
 *   delivers one last hover after a drop ends. Nothing is lost.
 * `recordError` runs the same filter, so a query cancelled on unmount stays
 * out too.
 * A 65 s fetch timeout (`TimeoutError`) and a "Failed to fetch" stay
 * reported: those are the API or CORS, and someone has to look.
 */
export const isTelemetryNoise = (
  event: Pick<ErrorEvent, "error"> | ErrorEvent | PromiseRejectionEvent
): boolean => {
  const thrown: unknown =
    "reason" in event ? event.reason : (event.error ?? undefined);
  const name =
    thrown && typeof thrown === "object" && "name" in thrown
      ? String(thrown.name)
      : "";
  const message =
    thrown && typeof thrown === "object" && "message" in thrown
      ? String(thrown.message)
      : "message" in event
        ? String(event.message ?? "")
        : "";
  const stack =
    thrown && typeof thrown === "object" && "stack" in thrown
      ? String(thrown.stack ?? "")
      : "";
  return (
    name === "AbortError" ||
    message.startsWith("ResizeObserver loop") ||
    message === "Cannot call hover while not dragging." ||
    (message === "Script error." && !thrown) ||
    /^(chrome|moz|safari)-extension:\/\//mu.test(stack) ||
    /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/u.test(
      message
    )
  );
};

/**
 * Starts CloudWatch RUM for one app. No-op locally and whenever the app
 * monitor id is missing, which is also the kill switch: the id stays unset in
 * Amplify until the API is deployed with `X-Amzn-Trace-Id` allowed by CORS.
 */
export const initRum = (
  app: string,
  appMonitorId: string | undefined,
  releaseId: string
): void => {
  sensitiveSurface = app === "checkout";
  if (!appMonitorId || LOCAL_HOSTNAMES.includes(window.location.hostname)) {
    return;
  }

  const config: AwsRumConfig = {
    // The app monitor's resource policy allows unsigned `rum:PutRumEvents`
    // only for this alias, so there is no Cognito identity pool to sign with.
    alias: `nicer-${app}`,
    allowCookies: true,
    disableAutoPageView: sensitiveSurface,
    recordResourceUrl: !sensitiveSurface,
    ...(app === "portal"
      ? {
          fetchFunction: portalRumFetch,
          // An advisor session spans many routes and API calls.
          sessionEventLimit: 10_000,
          batchLimit: 20,
          useBeacon: false,
          compressionStrategy: { enabled: false },
        }
      : {}),
    enableXRay: true,
    endpoint: RUM_ENDPOINT,
    releaseId,
    sessionSampleRate: FULL_SAMPLE_RATE,
    signing: false,
    // Payment surfaces report explicit sanitized errors only; automatic HTTP,
    // error and performance plugins can capture URLs and arbitrary messages.
    telemetries: sensitiveSurface
      ? []
      : [
          ["errors", { ignore: isTelemetryNoise }],
          "performance",
          [
            "http",
            {
              addXRayTraceIdHeader: API_URL_PATTERNS,
              recordAllRequests: true,
              ...(app === "portal" ? { urlsToInclude: API_URL_PATTERNS } : {}),
            },
          ],
        ],
  };

  try {
    client = new AwsRum(appMonitorId, releaseId, RUM_REGION, config);
  } catch {
    // Telemetry must never take the app down.
  }
};

export const recordError = (error: unknown): void => {
  try {
    if (isTelemetryNoise({ error })) {
      return;
    }
    if (sensitiveSurface) {
      // Do not forward the original message, stack, cause, response or input.
      client?.recordError(new Error("Application operation failed"));
    } else {
      client?.recordError(error);
    }
  } catch {
    // Telemetry must never take the app down.
  }
};

/** Attributes are searchable in Transaction Search. Never email or name. */
export const tagSession = (attributes: SessionAttributes): void => {
  if (!client) {
    return;
  }

  const defined: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined) {
      defined[key] = value;
    }
  }

  try {
    client.addSessionAttributes(defined);
  } catch {
    // Telemetry must never take the app down.
  }
};
