# Human Approval Boundaries

Agents may prepare, analyze, code, test, document, and propose changes.

Explicit human authorization is required before:

- production deployment
- production schema migration execution
- destructive production data operations
- secret/key rotation
- infrastructure deletion
- payment/billing configuration
- irreversible third-party account changes
- force pushing shared branches
- bypassing security or branch protections

The agent may still prepare the exact commands, migration, checklist, rollback,
and verification procedure without executing the irreversible step.
