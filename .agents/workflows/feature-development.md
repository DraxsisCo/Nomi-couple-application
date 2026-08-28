# Feature Development Workflow

## Route
Product Manager → Architect when needed → Implementer(s) → Test Engineer → Security/Accessibility/Data specialist when triggered → Code Reviewer → Tech Lead

## Steps
1. Create task envelope and classify risk.
2. Product Manager defines problem, scope, non-goals, permissions, and acceptance criteria.
3. Architect reviews if cross-boundary, high-risk, data-model, API, or integration changes are meaningful.
4. Engineering implements smallest coherent slice.
5. Test Engineer maps acceptance criteria to automated/explicit verification.
6. Trigger mandatory specialists from `ROUTING.md`.
7. Independent Code Reviewer inspects diff.
8. Tech Lead resolves blockers and checks definition of done.
9. Stop at human approval if deployment or irreversible action is requested.

## Exit
- acceptance criteria evidenced
- required gates pass
- final diff reviewed
- validation reported truthfully
