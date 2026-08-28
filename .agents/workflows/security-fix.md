# Security Fix Workflow

## Route
Security Engineer → Relevant Architect → Implementer → AppSec Reviewer → Test Engineer → Tech Lead → Human approval when irreversible

## Steps
1. Preserve evidence without reproducing live secrets.
2. Classify exposure and affected trust boundary.
3. Contain through code/config changes that are safe to prepare.
4. Design remediation and compatibility impact.
5. Implement with security regression tests.
6. AppSec performs independent review.
7. Verify old vulnerable path is blocked.
8. If secret rotation or production action is required, prepare runbook and stop for human approval.
