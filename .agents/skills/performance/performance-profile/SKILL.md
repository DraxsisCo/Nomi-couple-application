# Performance Profile

## Purpose
Measure a performance problem before optimizing it.

## Procedure
1. Define the user-visible or system performance target.
2. Establish a reproducible baseline.
3. Profile the relevant path.
4. Identify the dominant bottleneck.
5. Change one meaningful factor at a time.
6. Re-measure against the same baseline.
7. Check correctness and resource tradeoffs.

## Guardrails
- Do not optimize from intuition alone when measurement is available.
- Preserve correctness before chasing benchmark numbers.

## Output
Return baseline, bottleneck evidence, change, post-change result, and tradeoffs.
