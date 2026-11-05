# xtara-web agent instructions

Read `../AGENTS.md`, `../workspace.yaml`, and the active feature manifest before
product work. Use `../bin/xtara status` for repository state, feature manifests
for current work, and `../knowledge/` for context and accepted lessons. Workspace
tools provide validation and evidence.

This Next.js application owns web learner and administrative presentation. For
learner features, inspect and implement the Flutter equivalent. Shared rules and
signed-in state belong to `xtara-api`, not React ranking or local persistence.
Firebase Auth may provide identity tokens; new signed-in domain writes must use
authenticated API contracts.

Focused commands:

```bash
./node_modules/.bin/tsc --noEmit
npm test -- <focused-test-path>
npm run lint
```

Use `../bin/xtara verify web --quick` for the declared repository gate. Verify
loading, empty, error, retry, dark mode, localization, and compact web states.
