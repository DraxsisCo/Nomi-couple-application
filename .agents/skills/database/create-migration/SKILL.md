# Create Migration

## Purpose

Create a safe, reviewable schema migration.

## Procedure

1. Inspect current schema/migration style.
2. Design forward migration.
3. Assess existing data.
4. Avoid unsafe assumptions.
5. Add indexes/constraints deliberately.
6. Plan rollback or compensating migration.
7. Test against representative state.

## Guardrails

- Do not assume production tables are empty.

## Output

Return:
- result
- evidence
- risks
- required follow-up
