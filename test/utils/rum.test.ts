// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://booking.dev.nicer.travel/"}
import {
  afterEach,
  beforeEach,
  expect,
  it,
  onTestFinished,
  vi,
} from "vite-plus/test";

import { isTelemetryNoise } from "../../src/utils/rum";

/** The CloudWatch RUM web client, as far as the app talks to it. */
const rum = vi.hoisted(() => ({
  addSessionAttributes: vi.fn(),
  config: vi.fn(),
  recordError: vi.fn(),
  start: vi.fn(),
}));

vi.mock("aws-rum-web", () => ({
  AwsRum: class {
    addSessionAttributes = rum.addSessionAttributes;
    recordError = rum.recordError;
    constructor(
      monitorId: string,
      releaseId: string,
      region: string,
      config: unknown
    ) {
      rum.start(monitorId, releaseId, region);
      rum.config(config);
    }
  },
}));

beforeEach(() => {
  // The client and the surface live in the module: each test starts it afresh.
  vi.resetModules();
});

afterEach(() => {
  vi.resetAllMocks();
});

const freshRum = () => import("../../src/utils/rum");

type Telemetry = string | [string, Record<string, unknown>];

/** The options RUM was started with for one telemetry. */
const telemetry = (name: string) => {
  const config = rum.config.mock.lastCall?.[0] as
    | { telemetries: Telemetry[] }
    | undefined;
  const entry = config?.telemetries.find(
    (item) => (Array.isArray(item) ? item[0] : item) === name
  );
  return Array.isArray(entry) ? entry[1] : entry;
};

const aborted = () =>
  new DOMException("The user aborted a request.", "AbortError");

it.each([
  ["a request cancelled on leaving a screen", { error: aborted() }],
  [
    "a cancelled request nobody awaited",
    { reason: aborted() } as unknown as PromiseRejectionEvent,
  ],
  [
    "the browser's ResizeObserver notice",
    new ErrorEvent("error", {
      message: "ResizeObserver loop completed with undelivered notifications.",
    }),
  ],
  [
    "react-dnd's hover after a drop",
    { error: new Error("Cannot call hover while not dragging.") },
  ],
  [
    "a cross-origin script the browser says nothing about",
    new ErrorEvent("error", { message: "Script error." }),
  ],
  [
    "a chunk from an older release",
    {
      error: new TypeError(
        "Failed to fetch dynamically imported module: https://booking.dev.nicer.travel/assets/trip-1a2b.js"
      ),
    },
  ],
  [
    "a chunk from an older release in Safari",
    { error: new TypeError("Importing a module script failed.") },
  ],
  [
    "a chunk from an older release in Firefox",
    { error: new TypeError("error loading dynamically imported module") },
  ],
])("keeps %s out of the error reports", (_case, event) => {
  expect(isTelemetryNoise(event)).toBe(true);
});

it.each([
  [
    "a request that timed out",
    { error: new DOMException("signal timed out", "TimeoutError") },
  ],
  [
    "an API the browser could not reach",
    { error: new TypeError("Failed to fetch") },
  ],
  [
    "an error in the app",
    { error: new Error("Cannot read properties of undefined") },
  ],
  [
    "a cross-origin script that left its error",
    new ErrorEvent("error", {
      error: new Error("boom"),
      message: "Script error.",
    }),
  ],
])("reports %s", (_case, event) => {
  expect(isTelemetryNoise(event)).toBe(false);
});

it("starts nothing without an app monitor", async () => {
  const { initRum, tagSession } = await freshRum();

  initRum("booking", undefined, "release-1");
  tagSession({ company: "acme" });

  expect(rum.start).not.toHaveBeenCalled();
  expect(rum.addSessionAttributes).not.toHaveBeenCalled();
});

it.each(["http://localhost:5173/", "http://127.0.0.1:4173/"])(
  "starts nothing on a local server, %s",
  async (url) => {
    // The JSDOM instance vitest exposes, to move this page to another host.
    const { jsdom } = globalThis as typeof globalThis & {
      jsdom: { reconfigure: (settings: { url: string }) => void };
    };
    jsdom.reconfigure({ url });
    onTestFinished(() =>
      jsdom.reconfigure({ url: "https://booking.dev.nicer.travel/" })
    );
    const { initRum } = await freshRum();

    initRum("booking", "monitor-id", "release-1");

    expect(rum.start).not.toHaveBeenCalled();
  }
);

it("starts the app's monitor under its own alias, with the errors that matter", async () => {
  const { initRum } = await freshRum();

  initRum("booking", "monitor-id", "release-1");

  expect(rum.start).toHaveBeenCalledExactlyOnceWith(
    "monitor-id",
    "release-1",
    "us-east-1"
  );
  expect(rum.config.mock.lastCall?.[0]).toMatchObject({
    alias: "nicer-booking",
    releaseId: "release-1",
    signing: false,
  });
  const { ignore } = telemetry("errors") as {
    ignore: (event: Pick<ErrorEvent, "error">) => boolean;
  };
  expect(ignore({ error: aborted() })).toBe(true);
  expect(telemetry("performance")).toBe("performance");
});

it("traces every request but sends the trace header to the Nicer API only", async () => {
  const { initRum } = await freshRum();

  initRum("booking", "monitor-id", "release-1");

  const http = telemetry("http") as {
    addXRayTraceIdHeader: RegExp[];
    recordAllRequests: boolean;
    urlsToInclude?: RegExp[];
  };
  expect(http.recordAllRequests).toBe(true);
  expect(http.urlsToInclude).toBeUndefined();
  const traced = (url: string) =>
    http.addXRayTraceIdHeader.some((pattern) => pattern.test(url));
  expect(
    [
      "https://api.nicer.travel/booking/hotels",
      "https://api.dev.nicer.travel/booking/hotels",
      "https://api.stage.nicer.travel/booking/hotels",
      "/api/booking/hotels",
      "https://k3x2abc9.lambda-url.us-east-1.on.aws/chat",
    ].filter(traced)
  ).toHaveLength(5);
  expect(
    [
      "https://api.stripe.com/v1/payment_intents",
      "https://api-js.mixpanel.com/track",
      "https://api.nicer.travel.example.com/booking",
      "https://api.qa.nicer.travel/booking",
      "https://k3x2abc9.lambda-url.eu-west-1.on.aws/chat",
    ].filter(traced)
  ).toEqual([]);
});

it("leaves the noise out of the errors the app records", async () => {
  const { initRum, recordError } = await freshRum();
  initRum("booking", "monitor-id", "release-1");

  recordError(aborted());

  expect(rum.recordError).not.toHaveBeenCalled();
});

it("tags the session with the attributes that have a value", async () => {
  const { initRum, tagSession } = await freshRum();
  initRum("booking", "monitor-id", "release-1");

  tagSession({ admin: false, company: "acme", seats: 0, userId: undefined });

  expect(rum.addSessionAttributes).toHaveBeenCalledExactlyOnceWith({
    admin: false,
    company: "acme",
    seats: 0,
  });
});

it("never lets RUM take the app down", async () => {
  const { initRum, recordError, tagSession } = await freshRum();
  rum.start.mockImplementationOnce(() => {
    throw new Error("blocked by the content security policy");
  });
  expect(() => initRum("booking", "monitor-id", "release-1")).not.toThrow();

  initRum("booking", "monitor-id", "release-2");
  rum.recordError.mockImplementation(() => {
    throw new Error("quota");
  });
  rum.addSessionAttributes.mockImplementation(() => {
    throw new Error("quota");
  });

  expect(() => recordError(new Error("Cannot read properties"))).not.toThrow();
  expect(() => tagSession({ company: "acme" })).not.toThrow();
});

it("gives the portal every telemetry through one sanitized transport, never a beacon", async () => {
  const { initRum, recordError } = await freshRum();
  const { portalRumFetch } = await import("../../src/utils/rum-portal");

  initRum("portal", "monitor-id", "release-1");

  expect(rum.config.mock.lastCall?.[0]).toMatchObject({
    batchLimit: 20,
    compressionStrategy: { enabled: false },
    disableAutoPageView: false,
    fetchFunction: portalRumFetch,
    sessionEventLimit: 10_000,
    useBeacon: false,
  });
  for (const name of ["errors", "performance", "http"]) {
    expect(telemetry(name), name).toBeDefined();
  }
  const { urlsToInclude } = telemetry("http") as { urlsToInclude: RegExp[] };
  expect(
    urlsToInclude.some((pattern) =>
      pattern.test("https://api.dev.nicer.travel/booking/v2/search")
    )
  ).toBe(true);
  expect(
    urlsToInclude.some((pattern) =>
      pattern.test("https://api.stripe.com/v1/payment_intents")
    )
  ).toBe(false);
  const error = new TypeError("synthetic-private-message");
  recordError(error);
  expect(rum.recordError).toHaveBeenCalledWith(error);
});

it("keeps checkout to no automatic capture, and its errors to a fixed sentence", async () => {
  const { initRum, recordError } = await freshRum();

  initRum("checkout", "monitor-id", "release-1");

  expect(rum.config.mock.lastCall?.[0]).toMatchObject({
    disableAutoPageView: true,
    recordResourceUrl: false,
    telemetries: [],
  });
  recordError(new Error("synthetic-card-canary and token-canary"));
  const reported = rum.recordError.mock.calls[0]?.[0] as Error;
  expect(reported).toBeInstanceOf(Error);
  expect(reported.message).toBe("Application operation failed");
  expect(reported.stack).not.toContain("synthetic-card-canary");
  expect(reported.stack).not.toContain("token-canary");
});
