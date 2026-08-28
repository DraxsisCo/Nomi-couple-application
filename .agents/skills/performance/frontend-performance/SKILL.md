# Frontend Performance

## Purpose
Diagnose and improve frontend responsiveness, loading, rendering, and asset cost.

## Procedure
1. Define the affected user journey.
2. Measure current loading/rendering behavior.
3. Inspect network, bundle, rendering, and state-update costs.
4. Identify the dominant cause.
5. Apply the smallest effective change.
6. Re-measure.
7. Verify accessibility and behavior were not degraded.

## Guardrails
- Do not memoize everything by superstition.
- Do not trade correctness or accessibility for tiny synthetic gains.

## Output
Return measured issue, cause, fix, validation, and remaining risk.
