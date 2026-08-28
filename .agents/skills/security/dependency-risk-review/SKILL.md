# Dependency Risk Review

## Purpose

Review dependency changes for security and supply-chain risk.

## Procedure

1. Identify package/action/image source.
2. Check pinning/version policy.
3. Assess privileges and transitive impact.
4. Review known repository policy.
5. Recommend safer alternative if needed.

## Guardrails

- Do not bypass security gates to make CI green.

## Output

Return:
- result
- evidence
- risks
- required follow-up
