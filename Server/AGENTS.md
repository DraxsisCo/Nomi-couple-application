# Server Agent Rules

- Controllers/handlers stay thin.
- Business rules belong in service/domain modules.
- Validate untrusted input at authoritative boundaries.
- Enforce authentication and authorization server-side.
- Database changes require migrations.
- Do not access environment variables outside the repository's approved config layer.
- Never expose internal errors or secrets to clients.
- Add tests for business rules and authorization changes.
