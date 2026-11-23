import react from "@vitejs/plugin-react";
import ultraciteFmt from "ultracite/oxfmt";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import reactLint from "ultracite/oxlint/react";
import { defineConfig } from "vite-plus";

import pkg from "./package.json" with { type: "json" };

// The apps bring their own React, styled-components and the rest: bundling a
// second copy would split React context and styled-components themes.
const external = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
];

// One file for the whole toolchain: `vp build` (library), `vp check` (format,
// lint, types), `vp test`.
export default defineConfig({
  plugins: [react()],

  // `vp build`: one ES module, its CSS in dist/styles.css. Declarations come
  // from tsc (see the build script).
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

  fmt: {
    ...ultraciteFmt,
    ignorePatterns: [...(ultraciteFmt.ignorePatterns ?? []), "dist"],
  },

  // Ultracite's presets are the baseline: every rule applies to new code.
  //
  // The kit came from the Nicer monorepo with code written before these rules.
  // Each rule that still fires there is off below with its hit count, so this
  // file is the debt inventory. To pay one off, fix its sites (by hand: some
  // autofixes change behavior, such as emptying effect dependency lists) and
  // delete its line.
  lint: {
    extends: [core, reactLint, antiSlop],
    options: { typeAware: true, typeCheck: true },

    ignorePatterns: [...(core.ignorePatterns ?? []), "dist"],
    rules: {
      // --- Decisions ---------------------------------------------------------
      // These can only be satisfied by swapping the element (<div role="button">
      // to <button>), a visual regression: reset.css resets only `appearance`
      // and `background`, so a <button> keeps the browser's border, padding and
      // font. Keyboard access comes from role + tabIndex + Enter/Space instead.
      "jsx-a11y/prefer-tag-over-role": "off",
      "jsx-a11y/no-noninteractive-element-to-interactive-role": "off",
      // Wants a hand-written `SAFETY:` comment on every `as` cast.
      "anti-slop/require-safety-comment-for-type-assertion": "off",

      // --- Debt: legacy hits per rule ----------------------------------------
      // Type-aware rules (`options.typeAware`).
      "typescript/strict-boolean-expressions": "off", // 182
      "typescript/no-confusing-void-expression": "off", // 104
      "typescript/strict-void-return": "off", // 78
      "typescript/no-unsafe-type-assertion": "off", // 47
      "typescript/prefer-nullish-coalescing": "off", // 20
      "typescript/no-unsafe-assignment": "off", // 19
      "typescript/promise-function-async": "off", // 18
      "typescript/no-unnecessary-type-assertion": "off", // 12
      "typescript/consistent-return": "off", // 9
      "typescript/no-unsafe-member-access": "off", // 7
      "typescript/non-nullable-type-assertion-style": "off", // 6
      "typescript/no-deprecated": "off", // 4
      "typescript/no-unnecessary-type-conversion": "off", // 4
      "typescript/no-unsafe-argument": "off", // 3
      "typescript/no-base-to-string": "off", // 2
      "typescript/no-useless-default-assignment": "off", // 1
      "typescript/return-await": "off", // 1
      "typescript/no-unnecessary-type-parameters": "off", // 1
      "typescript/no-misused-spread": "off", // 1
      // Syntax rules.
      "unicorn/filename-case": "off", // 79
      "react/function-component-definition": "off", // 51
      "eslint/func-style": "off", // 49
      "eslint/require-unicode-regexp": "off", // 30
      "eslint/no-use-before-define": "off", // 20
      "eslint/sort-keys": "off", // 19
      "react/exhaustive-effect-dependencies": "off", // 15
      "anti-slop/no-runtime-typeof": "off", // 14
      "react/set-state-in-effect": "off", // 14
      "eslint/prefer-named-capture-group": "off", // 13
      "react-hooks/exhaustive-deps": "off", // 12
      "react/refs": "off", // 12
      "eslint/require-await": "off", // 11
      "import/no-named-as-default": "off", // 11
      "unicorn/prefer-string-replace-all": "off", // 11
      "eslint/no-nested-ternary": "off", // 11
      "unicorn/no-useless-undefined": "off", // 10
      "anti-slop/no-unknown-parameters": "off", // 9
      "anti-slop/no-shape-in-symbol-names": "off", // 8
      "eslint/no-shadow": "off", // 7
      "eslint/prefer-destructuring": "off", // 7
      "unicorn/consistent-function-scoping": "off", // 6
      "promise/prefer-await-to-then": "off", // 6
      "eslint/complexity": "off", // 5
      "unicorn/prefer-number-coercion": "off", // 5
      "unicorn/prefer-dom-node-dataset": "off", // 4
      "unicorn/prefer-query-selector": "off", // 4
      "eslint/no-empty-function": "off", // 4
      "unicorn/prefer-spread": "off", // 4
      "eslint/arrow-body-style": "off", // 4
      "eslint/operator-assignment": "off", // 4
      "anti-slop/no-known-value-widening": "off", // 3
      "eslint/no-inline-comments": "off", // 3
      "react/button-has-type": "off", // 3
      "anti-slop/no-unsafe-dictionary-type": "off", // 3
      "typescript/no-invalid-void-type": "off", // 2
      "anti-slop/no-module-mocking": "off", // 2
      "react/hook-use-state": "off", // 2
      "promise/avoid-new": "off", // 2
      "react/no-object-type-as-default-prop": "off", // 2
      "anti-slop/no-chained-type-assertions": "off", // 2
      "unicorn/prefer-add-event-listener": "off", // 2
      "anti-slop/no-conditional-empty-object-spread": "off", // 2
      "react/memo-dependencies": "off", // 2
      "react/display-name": "off", // 2
      "react/jsx-no-constructed-context-values": "off", // 1
      "eslint/no-void": "off", // 1
      "react/jsx-no-useless-fragment": "off", // 1
      "react/no-deriving-state-in-effects": "off", // 1
      "typescript/no-empty-interface": "off", // 1
      "typescript/no-empty-object-type": "off", // 1
      "typescript/no-explicit-any": "off", // 1
      "unicorn/prefer-set-has": "off", // 1
      "react/immutability": "off", // 1
      "react/jsx-handler-names": "off", // 1
      "anti-slop/no-unknown-returns": "off", // 1
      "oxc/no-barrel-file": "off", // 1
      "typescript/consistent-type-definitions": "off", // 1
      "react/purity": "off", // 1
      "react/todo": "off", // 1
      "eslint/no-plusplus": "off", // 1
    },
    overrides: [
      {
        // Test-only debt.
        files: ["**/*.test.{ts,tsx}", "test/**/*.{ts,tsx}"],
        rules: {
          "vitest/require-top-level-describe": "off", // 180
          "vitest/require-mock-type-parameters": "off", // 90
          "vitest/prefer-strict-equal": "off", // 48
          "vitest/prefer-to-be-truthy": "off", // 18
          "vitest/prefer-describe-function-title": "off", // 15
          "vitest/prefer-to-be-falsy": "off", // 15
          "vitest/prefer-import-in-mock": "off", // 2
          "vitest/prefer-spy-on": "off", // 1
          "vitest/prefer-called-with": "off", // 1
          "vitest/prefer-expect-resolves": "off", // 1
          "vitest/require-to-throw-message": "off", // 1
          "typescript/unbound-method": "off", // 2
          "typescript/no-unsafe-return": "off", // 1
          // vitest declares `expect(actual, message?)`; the message is diagnostics.
          "vitest/valid-expect": ["error", { maxArgs: 2 }],
        },
      },
    ],
  },

  // Node is the default environment; component tests opt in per file with a
  // `// @vitest-environment jsdom` docblock.
  test: {
    // Vitest v4 behavior: keep mock call history between tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    clearMocks: false,
    env: { TZ: "UTC" },
    // Node 26 ships its own localStorage global, which hides jsdom's in DOM tests.
    execArgv: ["--no-experimental-webstorage"],
    environment: "node",
    setupFiles: ["./test/support/browser-layout.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
    testTimeout: 15_000,
  },
});
