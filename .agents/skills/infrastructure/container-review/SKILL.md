# Container Review

## Purpose

Review container build/runtime configuration.

## Procedure

1. Inspect base image and build stages.
2. Minimize privileges.
3. Avoid secrets in layers.
4. Review exposed ports/health checks.
5. Review cache and deterministic builds.

## Guardrails

- Do not bake environment secrets into images.

## Output

Return:
- result
- evidence
- risks
- required follow-up
