# @withnicer/ui

[![Release](https://github.com/withnicer/ui/actions/workflows/release.yml/badge.svg)](https://github.com/withnicer/ui/actions/workflows/release.yml) [![npm](https://img.shields.io/npm/v/@withnicer/ui)](https://www.npmjs.com/package/@withnicer/ui)

Nicer's design system: the React 19 components, design tokens and global styles behind the advisor portal, the traveler booking site, Pay and Octopus.

## Install

```sh
bun add @withnicer/ui react react-dom styled-components
bun add -d sass
```

React, React DOM and styled-components are peer dependencies, so the app and the kit share one copy of each (one React context, one theme).

## Use

Load the styles once, at the app root, then import components:

```tsx
import "@withnicer/ui/styles.sass";
import { Button, ThemeProvider } from "@withnicer/ui";

export const App = () => (
  <ThemeProvider>
    <Button>Book</Button>
  </ThemeProvider>
);
```

### What is exported

| Entry | Contents |
| --- | --- |
| `@withnicer/ui` | Components, contexts, hooks and utilities, all listed in [`src/index.ts`](src/index.ts) |
| `@withnicer/ui/styles.sass` | Tokens, typography, dark mode, the reset, the icon font and The Seasons and Inter fonts |
| `@withnicer/ui/dial-codes.json` | Country dial codes with flags, for phone inputs |
| `@withnicer/ui/fonts/<file>` | The Seasons font files (for PDFs and canvases that need a URL) |

Components: Actions, AgencyMark, Autocomplete, Button, Calendar, CardInput, Check, DateInput, DetailDrawer, Dialog, Dropdown, EmptyState, ErrorBoundary, FileInput, Grip, Icon, IconButton, MaintenanceGate, Modal, NavButton, NumberInput, Overlay, Paginator, PhoneInput, PriceInput, RadioButton, RangeSlider, Select, Separator, SideNav, SignInCard, Spinner, StatusManager, Switch, Tabs, Tag, TextArea, TextInput, ThemeProvider, ThemeSwitch, TimeInput, Toast, Toggle, Tooltip and Tour.

Tokens and `.ui-*` classes live in [`src/styles/styles.sass`](src/styles/styles.sass); icon names in [`src/styles/icons/style.css`](src/styles/icons/style.css).

## Develop

Everything runs through [Vite+](https://viteplus.dev) (`vp`), configured in [`vite.config.ts`](vite.config.ts). Vite+ pins and installs the Node.js and bun versions itself; bun stays the package manager (`packageManager` in `package.json`), so `vp install` runs `bun install` on `bun.lock`.

| Command | What it does |
| --- | --- |
| `vp install` | Install dependencies and the git hooks |
| `vp check` | Format check ([Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html)), lint ([Oxlint](https://oxc.rs/docs/guide/usage/linter.html) with [Ultracite](https://www.ultracite.ai) rules) and type check |
| `vp check --fix` | Format and apply safe lint fixes |
| `vp pack` | Build `dist/`: one ES module and its bundled type declarations |
| `vp test` | Run the unit tests |

Git hooks live in [`.vite-hooks`](.vite-hooks): before a commit, `vp staged` runs `vp check --fix` on the staged files; the commit message must follow Conventional Commits, since releases are picked from it.

## Release

Releases are automatic. Every push to `main` runs the [Release workflow](.github/workflows/release.yml): `vp check`, the build, then [semantic-release](https://semantic-release.gitbook.io), which picks the next version from the [Conventional Commits](https://www.conventionalcommits.org) since the last release, publishes to npm and writes the GitHub release.

| Commit                                                             | Release |
| ------------------------------------------------------------------ | ------- |
| `fix(button): Keep the focus ring on Safari`                       | patch   |
| `feat(tabs): Add a vertical layout`                                | minor   |
| `feat!: Rename Toggle's value prop` or a `BREAKING CHANGE:` footer | major   |
| `docs:`, `chore:`, `ci:`, `test:`, `refactor:`                     | none    |

Publishing uses npm [trusted publishing](https://docs.npmjs.com/trusted-publishers): npm trusts this repository's `release.yml` through OpenID Connect, so there is no npm token to store or rotate.
