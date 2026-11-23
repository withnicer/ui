import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Unit tests for the UI kit. Node is the default environment; component tests
 * opt in per file with a `// @vitest-environment jsdom` docblock.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    env: { TZ: "UTC" },
    // Node 26 ships its own localStorage global, which hides jsdom's in DOM tests.
    execArgv: ["--no-experimental-webstorage"],
    environment: "node",
    setupFiles: ["./test/support/browser-layout.ts"],
    // Its tests still live in apps/portal; this line goes when they move here.
    passWithNoTests: true,
    include: ["test/**/*.test.{ts,tsx}"],
    // `bun run test` runs every package at once: on a loaded machine a jsdom
    // render with user-event typing can take longer than the default 5 s.
    testTimeout: 15_000,
    // Half the cores each: `bun run test` runs four packages at once.
    maxWorkers: "50%",
  },
});
