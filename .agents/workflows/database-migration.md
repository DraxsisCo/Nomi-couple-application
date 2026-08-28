# Database Migration Workflow

## Route
Data Architect/Database Engineer → Backend Engineer → Database Ops → QA → Tech Lead → Human approval for production execution

## Steps
1. Inspect current schema and data assumptions.
2. Classify migration as additive, transform, or destructive.
3. Plan expand/migrate/contract for risky compatibility changes.
4. Assess locks, table size, indexes, and backfill.
5. Implement migration and application compatibility.
6. Test against representative data.
7. Define verification and rollback/forward-fix.
8. Production execution requires explicit approval.
