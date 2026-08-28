# Diff Review

## Purpose

Perform a focused final diff review.

## Procedure

1. Inspect changed files.
2. Identify unrelated modifications.
3. Check accidental debug/generated artifacts.
4. Check security-sensitive lines.
5. Confirm docs/tests align.

## Guardrails

- A passing test suite does not excuse a bad diff.

## Output

Return:
- result
- evidence
- risks
- required follow-up
