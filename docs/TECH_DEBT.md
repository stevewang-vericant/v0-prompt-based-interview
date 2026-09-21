# Technical Debt

Known issues that are intentionally deferred. Prefer fixing Critical/High production risks first.

## TD-001: Credits balance race can oversell (C5)

- **Status**: Resolved on 2026-09-21 (negative balances prevented)
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

### Resolution

Video completion now serializes per interview, then conditionally decrements with
`credits_balance >= 1` in the same transaction. A competing completion that
cannot acquire the final credit rolls back and enters the explicit failed state,
so the school balance cannot become negative and one interview cannot debit
twice.

### Optional future improvement

1. Reserve a credit when the interview is created to fail earlier, before media upload.
2. Add a database `CHECK (credits_balance >= 0)` as defense in depth.
3. Link `CreditTransaction` rows to `interview_id` for auditability.

The optional items improve UX and auditability but are no longer required to
prevent the reproduced negative-balance race.
