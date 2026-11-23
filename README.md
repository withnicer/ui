# @withnicer/ui

[![Release](https://github.com/withnicer/ui/actions/workflows/release.yml/badge.svg)](https://github.com/withnicer/ui/actions/workflows/release.yml) [![npm](https://img.shields.io/npm/v/@withnicer/ui)](https://www.npmjs.com/package/@withnicer/ui)

Nicer's design system: the React 19 components, design tokens and global styles behind the advisor portal, the traveler booking site, Pay and Octopus.

## Install

```sh
bun add @withnicer/ui react react-dom styled-components
bun add -d sass
```

React, React DOM and styled-components are peer dependencies, so the app and the kit share one copy of each (one React context, one theme).

The Nicer apps install it under its old name, so their imports stay `@nicer/ui`:

```json
{ "dependencies": { "@nicer/ui": "npm:@withnicer/ui@^1.0.0" } }
```

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

The toolchain is [Vite+](https://viteplus.dev) (`vp`) with bun as the package manager. Everything is configured in [`vite.config.ts`](vite.config.ts).

| Command | What it does |
| --- | --- |
| `vp install` | Install dependencies |
| `vp dev` | Start the Vite dev server |
| `vp check` | Format check, lint ([Ultracite](https://www.ultracite.ai) rules on Oxlint) and type check |
| `vp check --fix` | Format and apply safe lint fixes |
| `vp run build` | Build `dist/` (ES module and type declarations) |
| `vp test` | Run the unit tests |

## Release

Releases are automatic. Every push to `main` runs the [Release workflow](.github/workflows/release.yml): `vp check`, the build, then [semantic-release](https://semantic-release.gitbook.io), which picks the next version from the [Conventional Commits](https://www.conventionalcommits.org) since the last release, publishes to npm and writes the GitHub release.

| Commit                                                             | Release |
| ------------------------------------------------------------------ | ------- |
| `fix(button): Keep the focus ring on Safari`                       | patch   |
| `feat(tabs): Add a vertical layout`                                | minor   |
| `feat!: Rename Toggle's value prop` or a `BREAKING CHANGE:` footer | major   |
| `docs:`, `chore:`, `ci:`, `test:`, `refactor:`                     | none    |

Publishing uses the `NPM_TOKEN` secret of the withnicer GitHub organization.
