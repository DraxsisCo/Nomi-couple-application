# Regression Testing

## Purpose

Create coverage proving a reported bug cannot silently return.

## Procedure

1. Reproduce the bug first when possible.
2. Write a failing test representing the bug.
3. Implement fix.
4. Verify test passes.
5. Check adjacent behavior.

## Guardrails

- Do not weaken the assertion to fit the implementation.

## Output

Return:
- result
- evidence
- risks
- required follow-up
