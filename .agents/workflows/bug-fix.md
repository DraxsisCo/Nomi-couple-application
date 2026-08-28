# Bug Fix Workflow

## Route
Triage owner → Relevant engineer → Test Engineer → Reviewer

## Steps
1. Reproduce or establish evidence of the defect.
2. Determine expected behavior from requirements/tests/product evidence.
3. Write a regression test first when practical.
4. Implement the smallest root-cause fix.
5. Check adjacent behavior for the same failure pattern.
6. Run focused tests, then appropriate broader checks.
7. Independent reviewer inspects for masking, swallowed errors, or weakened tests.

## Escalate
Use architecture/security/data specialists when the root cause crosses their domains.
