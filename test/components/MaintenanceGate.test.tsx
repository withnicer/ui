// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MaintenanceGate from "../../src/components/MaintenanceGate";

const API = "https://api.dev.nicer.travel/";
const FLAG_URL = "https://api.dev.nicer.travel/config/AppVersion/web";

/** The API's answer to `GET /config/AppVersion/web`. */
const answer = (status: number, body: unknown = {}) => ({
  json: () => Promise.resolve(body),
  ok: status >= 200 && status < 300,
  status,
});

const fetchMock = vi.fn();
let container: HTMLDivElement;
let root: Root;

/** The app behind the gate, for a visitor whose session `getToken` reads. */
const open = async (getToken?: () => Promise<string | null | void>) => {
  await act(async () => {
    root.render(
      <MaintenanceGate apiUrl={API} getToken={getToken}>
        <p>The app</p>
      </MaintenanceGate>
    );
  });
};

const shows = (text: string) => container.textContent?.includes(text);

describe("MaintenanceGate", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("reads the flag with the session's token and keeps the app while it is off", async () => {
    fetchMock.mockResolvedValue(answer(200, { isUnderMaintenance: false }));

    await open(() => Promise.resolve("id-token"));

    await vi.waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(FLAG_URL, {
        headers: { Authorization: "Bearer id-token" },
      })
    );
    expect(shows("The app")).toBe(true);
  });

  it("takes over the screen while the flag is on", async () => {
    fetchMock.mockResolvedValue(answer(200, { isUnderMaintenance: true }));

    await open(() => Promise.resolve("id-token"));

    await vi.waitFor(() => expect(shows("be right back")).toBe(true));
    expect(container.querySelector("[role='status']")).not.toBeNull();
    expect(shows("The app")).toBe(false);
  });

  it("asks nothing for a visitor who is not signed in", async () => {
    await open(() => Promise.resolve(undefined));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(shows("The app")).toBe(true);
  });

  it.each([
    ["the API refuses the read", () => Promise.resolve(answer(401))],
    ["the network fails", () => Promise.reject(new Error("offline"))],
    ["the answer has no flag", () => Promise.resolve(answer(200, {}))],
  ])("keeps the app when %s", async (_case, reply) => {
    fetchMock.mockImplementation(reply);

    await open(() => Promise.resolve("id-token"));

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(shows("The app")).toBe(true);
  });
});
