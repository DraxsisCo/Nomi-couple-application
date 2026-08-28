# Integration Testing

## Purpose

Test behavior across real internal boundaries.

## Procedure

1. Select meaningful boundary.
2. Use realistic dependencies where repository conventions allow.
3. Test persistence/serialization/auth behavior.
4. Clean up state deterministically.
5. Run targeted integration suite.

## Guardrails

- Avoid tests that depend on execution order.

## Output

Return:
- result
- evidence
- risks
- required follow-up
