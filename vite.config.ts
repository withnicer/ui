import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import pkg from "./package.json" with { type: "json" };

// The apps bring their own React, styled-components and the rest: bundling a
// second copy would split React context and styled-components themes.
const external = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
];

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "./src/index.ts",
      fileName: () => "index.js",
      cssFileName: "styles",
      formats: ["es"],
    },
    rollupOptions: {
      external: (id) =>
        external.some((name) => id === name || id.startsWith(`${name}/`)),
    },
  },
});
