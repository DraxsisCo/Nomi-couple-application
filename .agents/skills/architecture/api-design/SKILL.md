# API Design

## Purpose
Design or revise an API contract that is clear, secure, compatible, and consistent with repository conventions.

## Procedure
1. Inspect existing API patterns and consumers.
2. Define resource/action semantics.
3. Define request validation and authorization.
4. Define success and error contracts.
5. Consider idempotency, pagination, concurrency, and versioning where relevant.
6. Check backwards compatibility.
7. Define tests and observability needs.

## Guardrails
- Do not expose persistence internals accidentally.
- Do not rely on client-side authorization.
- Avoid novel response formats when repository conventions exist.

## Output
Return proposed contract, compatibility notes, security requirements, and test cases.
