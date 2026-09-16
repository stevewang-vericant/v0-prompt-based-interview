# Technical Debt

Known issues that are intentionally deferred. Prefer fixing Critical/High production risks first.

## TD-001: Credits balance race can oversell (C5)

- **Status**: Accepted for now (low urgency)
- **Priority**: Low
- **Logged**: 2026-09-15
- **Area**: School credits billing (`credits` mode)

### Problem

Interview start/upload only *reads* `schools.credits_balance` as a gate. The actual debit happens later when video merge completes (`decrement: 1` in `app/api/process-video-task/route.ts`). There is no atomic reservation and no `CHECK (credits_balance >= 0)`.

If a school has **1** credit left and two students pass the gate nearly simultaneously, both can finish merge and the balance can become **-1**.

### Evidence

- Gate: `app/actions/upload-video.ts` (credits check on create)
- Gate: `app/actions/prompts.ts` (prompts load / start path)
- Debit: `app/api/process-video-task/route.ts` (`credits_balance: { decrement: 1 }`)
- Schema: `prisma/schema.prisma` → `School.credits_balance Int` (no non-negative constraint)

### Suggested fix (later)

1. Reserve a credit when the interview is created (or use `UPDATE ... WHERE credits_balance >= 1 RETURNING`).
2. Add a DB constraint / conditional update so balance cannot go negative.
3. Optionally link `CreditTransaction` rows to `interview_id` for auditability.

### Why deferred

Current traffic and credit top-ups make concurrent last-credit collisions uncommon. Product can absorb rare oversell until a dedicated billing hardening pass.
