# Webhook Review

## Purpose

Review inbound webhook handling.

## Procedure

1. Verify signature/authentication.
2. Protect replay/idempotency.
3. Validate payload.
4. Acknowledge within provider constraints.
5. Queue heavy processing if appropriate.
6. Log safely.

## Guardrails

- Never trust a webhook merely because the route is obscure.

## Output

Return:
- result
- evidence
- risks
- required follow-up
