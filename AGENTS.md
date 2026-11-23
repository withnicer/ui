# Agent instructions

`@withnicer/ui` is Nicer's design system: React primitives, tokens and global styles, published to npm and installed by the Nicer apps. Read [README.md](README.md) for usage and the release flow.

## Rules

- English for everything in git: code, comments, docs and commit messages.
- Every public export goes through `src/index.ts`. Anything else a consumer imports must be listed in `exports` in `package.json`.
- Nothing app specific: no API calls, no Cognito or Amplify, no Nicer contracts. The host passes those in (`SignInCard` takes its CAPTCHA as the `captcha` prop).
- React, React DOM and styled-components stay peer dependencies.
- Never swap a DOM element to satisfy an accessibility rule: keep the node and add `role`, `tabIndex={0}` and Enter/Space handling.
- Lint debt is listed rule by rule in `vite.config.ts` with hit counts. Pay one off by fixing its sites by hand and deleting its line; do not run `vp check --fix-dangerously` across the repo, some fixes change behavior.
- Use `vp` for everything (install, check, pack, test); bun is the package manager underneath. Validate with `vp check` and `vp pack`. Run tests only when a human explicitly asks for that test run.
- Commits follow Conventional Commits: a push to `main` releases `fix` as a patch, `feat` as a minor and `!` / `BREAKING CHANGE` as a major. Removing or renaming an export is breaking.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Running Scripts

Run TypeScript and JavaScript files with `vpx <file>`, for example `vpx ./scripts/seed.ts --dry-run`. It handles enums, decorators, JSX, and tsconfig `paths`, so do not add `tsx` or `ts-node` to run scripts. `vpx --watch <file>` reruns the file when a file it uses changes, in place of `tsx watch`. `vp node <file>` runs plain Node.js.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+ release. Add a tool name to select part of the graph. For example, run `vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use `vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
