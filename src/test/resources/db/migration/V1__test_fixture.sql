-- TEST-ONLY MIGRATION. Lives under src/test/resources, not src/main/resources.
--
-- This exists solely to prove that Flyway discovers a migration, applies it
-- against real MySQL, and records it correctly in flyway_schema_history.
-- It is never part of QMSync's application schema history. Phase 1 creates
-- the genuine first application migration under
-- src/main/resources/db/migration -- that one, not this one, is V1 for
-- the real application.

CREATE TABLE flyway_test_fixture (
    id BIGINT PRIMARY KEY,
    note VARCHAR(100) NOT NULL
);
