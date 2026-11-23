// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://portal.dev.nicer.travel/"}
import { afterEach, expect, it, vi } from "vitest";

import { portalRumFetch, sanitizePortalRum } from "../../src/utils/rum-portal";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** One field of a RUM event as it leaves the browser. */
const sent = (key: string, value: unknown) =>
  JSON.parse(sanitizePortalRum(JSON.stringify({ [key]: value })))[key];

it.each([
  ["an email", "/users/maria@acme.com/edit", "/users/:id/edit"],
  ["an encoded name", "/users/Mar%C3%ADa/edit", "/users/:id/edit"],
  ["a long number", "/orders/1234567/items", "/orders/:id/items"],
  ["a token", `/invites/${"a".repeat(49)}`, "/invites/:id"],
  ["nothing private", "/orders/2026/items", "/orders/2026/items"],
])("hides a path segment holding %s", (_case, path, clean) => {
  expect(sent("url", path)).toBe(clean);
});

it.each(["url", "name", "filename", "referrer", "documentURL"])(
  "keeps the origin of a full %s and drops its query and fragment",
  (key) => {
    expect(
      sent(key, "https://api.dev.nicer.travel/orders/1234567?token=x#y")
    ).toBe("https://api.dev.nicer.travel/orders/:id");
  }
);

it("leaves text that is not a URL as it is", () => {
  expect(sent("name", "Commission report")).toBe("Commission report");
});

it("redacts a URL it cannot read", () => {
  expect(sent("url", "http://")).toBe("[redacted]");
});

it.each([
  ["unhandledrejection", "unhandledrejection"],
  ["CardDeclinedForMariaPerez", "Error"],
])("reports an error of type %s as %s", (type, reported) => {
  expect(sent("error", { message: "Declined", type })).toEqual({
    message: "Declined",
    type: reported,
  });
});

it.each([
  ["a batch", 1000, true],
  ["a batch too large for a page that is closing", 70_000, false],
])("sends %s with keepalive %s", async (_case, size, keepalive) => {
  const send = vi.fn(async (_request: Request) => new Response("{}"));
  vi.stubGlobal("fetch", send);

  await portalRumFetch(
    "https://dataplane.rum.us-east-1.amazonaws.com/appmonitors/monitor-id",
    {
      body: JSON.stringify({ RumEvents: [{ padding: "x".repeat(size) }] }),
      method: "POST",
    }
  );

  expect(send.mock.calls[0]?.[0].keepalive).toBe(keepalive);
});

it("removes URL secrets while keeping the route, title, error, HTTP status, timing and source-map position", () => {
  const body = JSON.stringify({
    Alias: "nicer-portal",
    RumEvents: [
      {
        details: JSON.stringify({
          duration: 125,
          message: "Cannot read properties of undefined (reading 'rate')",
          request: {
            url: "https://api.dev.nicer.travel/booking/v2/search?token=secret#private",
          },
          response: { status: 500 },
          stack:
            "TypeError: Cannot read properties of undefined (reading 'rate')\n at fn (https://portal.dev.nicer.travel/assets/index-abc.js:20:123456)",
          type: "TypeError",
        }),
        metadata: JSON.stringify({
          pageId: "/itinerary-builder/private-trip?token=secret",
          title: "Private Traveler",
        }),
        type: "com.amazon.rum.js_error_event",
      },
    ],
  });

  const clean = sanitizePortalRum(body);

  for (const secret of ["private-trip", "secret", "#private"]) {
    expect(clean).not.toContain(secret);
  }
  const [event] = JSON.parse(clean).RumEvents;
  expect(JSON.parse(event.metadata)).toMatchObject({
    pageId: "/itinerary-builder/:id",
    title: "Private Traveler",
  });
  expect(JSON.parse(event.details)).toMatchObject({
    duration: 125,
    message: "Cannot read properties of undefined (reading 'rate')",
    response: { status: 500 },
    stack: "at https://portal.dev.nicer.travel/assets/index-abc.js:20:123456",
    type: "TypeError",
  });
});

it("cleans the request it sends, and sends nothing it cannot read", async () => {
  const send = vi.fn(async (_request: Request) => new Response("{}"));
  vi.stubGlobal("fetch", send);
  const endpoint =
    "https://dataplane.rum.us-east-1.amazonaws.com/appmonitors/test";

  await portalRumFetch(
    new Request(endpoint, {
      body: JSON.stringify({
        RumEvents: [
          {
            details: JSON.stringify({
              request: {
                url: "https://api.dev.nicer.travel/x?synthetic-token",
              },
            }),
          },
        ],
      }),
      method: "POST",
    })
  );
  expect(await send.mock.calls[0]?.[0].text()).not.toContain("synthetic-token");

  await expect(
    portalRumFetch(new Request(endpoint, { body: "invalid", method: "POST" }))
  ).rejects.toThrow();
  expect(send).toHaveBeenCalledOnce();
});
