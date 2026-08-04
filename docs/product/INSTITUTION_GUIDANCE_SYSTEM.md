# Xtara institution guidance system

**Status:** Implemented MVP architecture  
**Date:** 2026-07-22

## Boundary

The institution product expands educator guidance capacity without changing the learner-owned Xtara account model.

- Schools, colleges, universities, and educational institutions are tenants.
- Classes, grades, departments, and guidance groups are organizational units inside a tenant.
- A student has zero or one active institution affiliation and may belong to several units within it.
- Institution membership grants scoped, consented access. It never transfers ownership of assessment, direction, or progress records.
- Platform content administration remains separate from institution administration.

## Learner joining

1. Preview the institution and class from a time-limited invitation code.
2. Complete the standard Xtara assessment or reuse a compatible saved assessment.
3. Sign in to a personal Xtara account.
4. Review the exact institution-sharing scopes and confirm guardian permission.
5. Activate membership through a server transaction that checks invitation capacity, expiry, institution lifecycle, assessment completion, consent version, and the one-institution invariant.

Student codes are reusable only within their configured expiry and capacity. Staff invitations are single-use and email-bound. Clear invitation codes are returned once and only an HMAC is persisted.

## Lifecycle

Institution lifecycle is derived from `accessStartsAt`, `accessEndsAt`, and `graceEndsAt` on every authorized request.

- `active`: joins, invitations, and mutations are allowed.
- `grace`: administrator access is read-only; new joins stop.
- `expired`: institution access ends.
- `suspended` and `archived`: access is denied independently of dates.

The protected `POST /api/v1/organizations/lifecycle/reconcile` operation is intended for a daily scheduler. It ends student membership and consent after grace expiry while preserving learner accounts and assessments. Renewal after reconciliation therefore requires a new invitation and consent.

## Authorization

The API resolves organization context from server-owned membership records. Client-provided organization IDs or roles never authorize access.

- Owners and organization administrators can view all units.
- Unit administrators, educators, and counselors are filtered to assigned units.
- Student membership provides participation controls but no educator dashboard access.
- Institution lifecycle changes and reconciliation require the existing Xtara platform-admin boundary.

## Responsible insights

The educator dashboard reports onboarding and assessment coverage, follow-up needs, direction progress, and privacy-thresholded cohort areas. It does not expose raw assessment answers, rank learners, or calculate unsupported fit percentages.

Named learner summaries require an active membership, active sharing grant, and an authorized institution or unit scope. Cohort areas are suppressed until the institution privacy threshold is reached.

## Operational commands

```bash
# Policy and lifecycle tests
npm run organization:test

# Legacy tenants preview; never writes
npm run organization:migrate

# Apply after reviewing conflicts and output
npm run organization:migrate -- --apply
```

The migration stops and reports users found in more than one legacy institution instead of choosing an institution silently.
