/**
 * Everything reaches RUM as the browser recorded it (error messages, page
 * title, clicked elements, status codes, timings) except URL secrets: query
 * strings, fragments and id-like path segments.
 */
const PAGE_SEGMENTS = new Set([
  "itinerary-builder",
  "internova-hotels",
  "chats",
  "earnings",
  "users",
  "learning-calendar",
  "discover",
  "lodgings",
  "flights",
  "activities",
  "car-rental",
  "bookings",
  "promotions",
  "settings",
  "integrations",
  "community",
  "new",
  "channel",
  "dm",
  "login",
  "verification-code",
]);

const cleanUrl = (value: string, page = false): string => {
  try {
    const url = new URL(value, window.location.origin);
    const path = url.pathname
      .split("/")
      .map((segment) => {
        if (!segment) {
          return segment;
        }
        if (page) {
          return PAGE_SEGMENTS.has(segment) ? segment : ":id";
        }
        return /@|%|\d{5,}/.test(segment) || segment.length > 48
          ? ":id"
          : segment;
      })
      .join("/");
    return value.startsWith("/") ? path : `${url.origin}${path}`;
  } catch {
    return "[redacted]";
  }
};

const cleanValue = (key: string, value: unknown): unknown => {
  if (
    value &&
    typeof value === "object" &&
    "message" in value &&
    "type" in value
  ) {
    const error = value as Record<string, unknown>;
    return {
      ...error,
      type: /^(Error|TypeError|RangeError|ReferenceError|SyntaxError|URIError|EvalError|AggregateError|AbortError|NetworkError|TimeoutError|unhandledrejection)$/.test(
        String(error.type)
      )
        ? error.type
        : "Error",
    };
  }
  if (typeof value !== "string") {
    return value;
  }
  if (["details", "metadata", "SessionMetadata"].includes(key)) {
    return JSON.stringify(JSON.parse(value), cleanValue);
  }
  if (/^(pageId|parentPageId)$/i.test(key)) {
    return cleanUrl(value, true);
  }
  if (
    /^(url|name|filename|referrer|documentURL)$/i.test(key) &&
    /^(https?:|\/)/.test(value)
  ) {
    return cleanUrl(value);
  }
  if (key === "stack") {
    // Preserve source-map coordinates, never the error message or arbitrary arguments.
    return (value.match(/https?:\/\/[^\s)]+\.js:\d+:\d+/g) ?? [])
      .map((frame) => {
        const source = frame.replace(/:\d+:\d+$/, "");
        return `at ${cleanUrl(source)}${frame.slice(source.length)}`;
      })
      .join("\n");
  }
  return value;
};

export const sanitizePortalRum = (body: string): string =>
  JSON.stringify(JSON.parse(body), cleanValue);

/** All Portal RUM batches pass here, including those sent while leaving a page. */
export const portalRumFetch = async (
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> => {
  const request = new Request(input, init);
  const body = sanitizePortalRum(await request.text());
  return fetch(
    new Request(request, {
      method: "POST",
      body,
      keepalive: new TextEncoder().encode(body).length < 60_000,
    })
  );
};
