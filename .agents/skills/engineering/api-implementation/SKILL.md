# Api Implementation

## Purpose

Implement or change an HTTP/API endpoint safely.

## Procedure

1. Locate the existing route/controller/service pattern.
2. Confirm request and response contracts.
3. Apply validation and server-side authorization.
4. Implement the smallest coherent change.
5. Add/update tests.
6. Run focused tests, then broader validation as risk requires.

## Guardrails

- Do not trust client-provided authorization state.
- Do not invent status codes or response shapes when existing conventions exist.

## Output

Return:
- result
- evidence
- risks
- required follow-up
