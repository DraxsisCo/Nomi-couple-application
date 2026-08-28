# Characterization Testing

## Purpose

Capture current behavior before risky refactoring.

## Procedure

1. Identify observable behavior.
2. Write tests around stable external behavior.
3. Avoid encoding known defects unless intentionally preserving temporarily.
4. Run before refactor.

## Guardrails

- Characterization tests are a safety net, not permanent worship of legacy behavior.

## Output

Return:
- result
- evidence
- risks
- required follow-up
