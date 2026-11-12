## Summary
### <type>(<scope>): <!-- e.g. feat(api): add posts CRUD endpoints -->
<!-- Brief description of the change — what does this PR do? -->

---

## Changes
<!-- What specifically was changed? Focus on the "what", not the "how" — the diff shows the how. -->
<!-- What problem does this solve? -->

---

## How
<!-- Key implementation decisions — why this approach? -->
<!-- Any trade-offs made? -->

---

## Testing
<!-- How was this tested? -->
- [ ] Unit tests added/updated (`pnpm test`)
- [ ] Integration / E2E tests added/updated
- [ ] Manually tested locally
- [ ] Verified in Docker Compose (`docker compose up --build`)
<!-- If manually tested, briefly describe the scenarios you verified: -->

---

## UI / Screenshots
<!-- Attach side-by-side screenshots if UI changed, or leave N/A for backend/infra PRs. -->
N/A

---

## Deployment Notes
<!-- Any special steps needed when deployed? Leave blank if none. Examples: run a migration, update an env variable, rebuild Docker images. -->

---

## Checklist
- [ ] Code follows project style guide (`pnpm typecheck` and `pnpm lint` passing)
- [ ] PR title follows Conventional Commits: `type(scope): short description`
- [ ] Branch follows naming convention: `type/short-description`
- [ ] Self-review completed — I've reviewed my own diff
- [ ] No unresolved merge conflicts
- [ ] CI checks are passing, and `pnpm typecheck && pnpm lint && pnpm test && pnpm build` passed locally before pushing
- [ ] Documentation updated in the same commit (if this changes setup or behavior)
- [ ] No secrets, credentials, or `.env` files in the code (`.env.example` updated if needed)
- [ ] No stray `console.log` statements left in production code
- [ ] `pnpm` only — pinned versions respected and lockfile in sync

---

## Risks & Considerations
**Risk level:** `low` | `medium` | `high`
<!-- For medium/high risk, explain what could go wrong and what safeguards are in place. -->

| Question | Answer |
| :--- | :--- |
| Does this touch auth, payments, or session logic? | Yes / No |
| Does this include a database migration? | Yes / No |
| Does this change environment variables or secrets? | Yes / No |
| Does this change CI/CD or deployment config? | Yes / No |
| Could this affect other features or services? | Yes / No |
| Is there a rollback plan beyond `git revert`? | N/A / Describe |
