# Load Test Plan

## Purpose
Create a realistic load test for throughput, latency, saturation, and failure behavior.

## Procedure
1. Define workload and user behavior.
2. Define concurrency/rate and data shape.
3. Define latency/error/resource targets.
4. Identify safe test environment and limits.
5. Include ramp-up, steady-state, and recovery.
6. Define observability during the test.
7. Define stop conditions and result interpretation.

## Guardrails
- Never direct unapproved load at production.
- Model realistic behavior rather than meaningless request floods.

## Output
Return workload model, environment, targets, metrics, stop conditions, and analysis method.
