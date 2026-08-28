# Release Workflow

## Route
Tech Lead → QA Lead → DevOps/SRE → Security when triggered → Human approval for production release

## Checks
- intended scope only
- tests/build/typecheck/lint as applicable
- migrations/config changes understood
- secrets/config present through approved mechanisms
- security gates pass
- rollout and rollback defined
- observability sufficient
- release notes/documentation updated

Agents may prepare release artifacts. Production execution requires explicit approval.
