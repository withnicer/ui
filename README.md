# @withnicer/ui

Nicer's design system: React 19 components, design tokens and global styles.

## Install

```sh
bun add @withnicer/ui react react-dom styled-components
```

The Nicer apps keep their imports as `@nicer/ui` with an npm alias:

```json
"@nicer/ui": "npm:@withnicer/ui@^0.1.0"
```

## Use

```tsx
import "@nicer/ui/styles.css"; // once, at the app root
import { Button, ThemeProvider } from "@nicer/ui";
```

Also exported as files: `@nicer/ui/dial-codes.json` and
`@nicer/ui/fonts/<file>` (The Seasons font).

## Develop

```sh
bun install
bun run check-types
bun run build
```

## Release

1. Bump `version` in `package.json` and commit.
2. `git tag v<version> && git push --tags`.

The Publish workflow builds and publishes to npm with the `NPM_TOKEN`
organization secret.
