# Realtime Testing

## Purpose

Test realtime behavior including reconnect and duplicate conditions.

## Procedure

1. Test normal delivery.
2. Test reconnect.
3. Test duplicate event.
4. Test unauthorized subscription.
5. Test stale/disconnected state.

## Guardrails

- Avoid timing-only assertions when event acknowledgements are available.

## Output

Return:
- result
- evidence
- risks
- required follow-up
