# Appsec Review

## Purpose

Perform an application-security review of a change.

## Procedure

1. Review authentication and authorization.
2. Review untrusted input and output encoding.
3. Review sensitive data and logging.
4. Review SSRF/path/query/injection surfaces.
5. Review error behavior.
6. Record blocking findings.

## Guardrails

- Use repository evidence; do not invent vulnerabilities.

## Output

Return:
- result
- evidence
- risks
- required follow-up
