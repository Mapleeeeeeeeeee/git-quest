# Quest Demo App

This is a demo project for testing **git-quest**. It intentionally has code quality issues that git-quest will detect as quests.

## Planted Issues

### Missing Documentation (📜 ★☆☆)
- `auth.ts`: `validateToken`, `generateToken`, `AuthManager` — no JSDoc
- `utils.ts`: `parseConfig`, `sleep`, `formatDate` — no JSDoc

### TODO/FIXME/HACK Comments (🔍 ★★☆)
- `auth.ts`: FIXME (validate expiry), TODO (add expiry), HACK (session management)
- `utils.ts`: TODO (error types), FIXME (quoted values), XXX (why exist), TODO (i18n)

### Missing Tests (🐉 ★★★)
- `auth.ts` — no test file
- `utils.ts` — no test file
- `parser.ts` — no test file

**Expected total: ~15 quests**
