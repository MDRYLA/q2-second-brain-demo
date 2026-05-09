# PRD — Q2 Second Brain (public demo)

(uzupełnij przez skill `prd-writer` albo ręcznie — w tym repo PRD jest opcjonalny, bo public demo to portfolio artifact, nie aktywny dev)

## Cel
Public-friendly portfolio version of personal "Second Brain + Coach" app, prepared as a code sample for Bison Fellowship 2026.

## Użytkownik
- **Primary:** Bison committee reviewers — clone repo, browse code, optionally `pnpm dev`.
- **Secondary:** developers forking to build their own personal second brain.

## Feature core
Cascade planning (Year → Quarter → Month → Week → Day) + daily check-in/check-out + journal + habit tracker + AI coach (optional). E2E client-side encryption (BIP-39 → AES-GCM).

## Poza zakresem (non-goals)
- Multi-user SaaS — this is a personal app
- Production support — fork at your own risk
- Active feature work — handled in private upstream

## Success metrics
- Reviewer can clone + `pnpm install` + `pnpm dev` in <2 min, no env config required
- Zero PII / zero live credentials in repo
- README + CUSTOMIZATION.md self-contained — reviewer doesn't need to ask Kacper questions
