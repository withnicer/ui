# Nicer UI

`@withnicer/ui`: Nicer's design system (React primitives, tokens in
`src/styles/styles.sass`, icons in `src/styles/icons/style.css`). The Nicer
apps install it from npm under the alias `@nicer/ui`.

- Keep code, documentation and commit messages in English.
- Every export goes through `src/index.ts`. Nothing app specific lives here:
  no API calls, no Cognito, no Nicer contracts.
- Verify with `bun run check-types` and `bun run build`. Run tests only when a
  human explicitly requests them.
- Release: bump `version` in `package.json`, commit, then push a tag
  `v<version>`; the Publish workflow builds and publishes to npm.
