# Contributing

This is a portfolio artifact, not actively maintained as a product. That said, contributions are welcome — here's what works.

## Bug reports

Open a [GitHub issue](https://github.com/MDRYLA/q2-second-brain-demo/issues). Include:
- What you tried to do
- What you expected
- What happened (with reproduction steps if possible)
- Browser + Node version

Response time is best-effort.

## Pull requests

If the change is small (typo, broken link, dependency bump for a known CVE), open a PR directly. For anything bigger — open an issue first to avoid wasted work, since this repo's roadmap doesn't extend much beyond "stay buildable".

Before submitting:
```bash
pnpm preflight   # typecheck + lint + tests + build
```

All checks must pass. PRs that introduce `console.log`, `// @ts-ignore`, or `any` will be rejected.

## What's out of scope

- New features that aren't strictly bug fixes or security patches. The author has a private upstream where feature work happens; this public repo is a snapshot, not a fork-for-development.
- Major refactors (extracting shared logic between the two UI variants, splitting the 1700-line client components, etc.). Tracked in `ARCHITECTURE.md` as known debt.
- Adding the AI coach implementation — left as an exercise, see `CUSTOMIZATION.md`.

## Forking for your own use

This is encouraged. The MIT license lets you do anything; `CUSTOMIZATION.md` walks through the setup. If you build something cool on top, drop a link in an issue — happy to add it to the README.
