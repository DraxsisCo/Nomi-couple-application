# Authorization Review

## Purpose

Verify that protected operations enforce authorization server-side.

## Procedure

1. Identify principal, resource, action, and required permission.
2. Trace server-side enforcement.
3. Test unauthenticated access.
4. Test insufficient role.
5. Test cross-tenant/resource access.
6. Verify safe failure response.

## Guardrails

- Frontend visibility is not authorization.
- Never trust client-provided role or ownership claims.

## Output

Return:
- result
- evidence
- risks
- required follow-up
