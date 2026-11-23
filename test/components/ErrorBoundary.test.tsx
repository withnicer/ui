// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://portal.dev.nicer.travel/"}
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import ErrorBoundary from "../../src/components/ErrorBoundary";
import { initRum } from "../../src/utils/rum";
import { getByText, queryAllByText, render } from "../support/render";

/** The CloudWatch RUM web client the boundary reports to. */
const rum = vi.hoisted(() => ({ recordError: vi.fn() }));

vi.mock("aws-rum-web", () => ({
  AwsRum: class {
    recordError = rum.recordError;
  },
}));

const crash = new TypeError(
  "Cannot read properties of undefined (reading 'rate')"
);

function Itinerary(): never {
  throw crash;
}

beforeEach(() => {
  initRum("portal", "monitor-id", "release-1");
  // React logs every error a boundary catches.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  rum.recordError.mockReset();
});

it("takes over the screen when the app crashes, and reports the crash", () => {
  render(
    <ErrorBoundary>
      <Itinerary />
    </ErrorBoundary>
  );

  expect(getByText("Something went wrong.")).toBeTruthy();
  expect(getByText("Please refresh the page or contact support.")).toBeTruthy();
  expect(rum.recordError).toHaveBeenCalledExactlyOnceWith(crash);
});

it("says what the app asks it to", () => {
  render(
    <ErrorBoundary message="Your trip could not be shown.">
      <Itinerary />
    </ErrorBoundary>
  );

  expect(getByText("Your trip could not be shown.")).toBeTruthy();
});

it("shows the app while nothing fails", () => {
  render(
    <ErrorBoundary>
      <p>Trip to Lisbon</p>
    </ErrorBoundary>
  );

  expect(getByText("Trip to Lisbon")).toBeTruthy();
  expect(queryAllByText("Something went wrong.")).toEqual([]);
});
