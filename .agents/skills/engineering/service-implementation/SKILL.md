# Service Implementation

## Purpose

Implement domain/service behavior without leaking concerns across layers.

## Procedure

1. Identify the domain invariant.
2. Inspect nearby service patterns.
3. Keep transport/presentation concerns outside the service.
4. Implement behavior and errors explicitly.
5. Add tests around business rules.

## Guardrails

- Avoid generic abstractions without repeated need.

## Output

Return:
- result
- evidence
- risks
- required follow-up
