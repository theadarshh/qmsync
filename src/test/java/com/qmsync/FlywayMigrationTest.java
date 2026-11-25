package com.qmsync;

import com.qmsync.testsupport.AbstractIntegrationTest;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Proves the Flyway mechanism itself: discovery, execution against real
 * MySQL, and version recording. Uses only the test-scoped fixture migration
 * (src/test/resources/db/migration/V1__test_fixture.sql) -- Phase 0 ships
 * zero migrations under src/main/resources.
 */
class FlywayMigrationTest extends AbstractIntegrationTest {

    @Autowired
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void flywayAppliesTheTestFixtureMigrationAndRecordsIt() {
        var applied = flyway.info().applied();

        assertThat(applied).hasSize(1);
        assertThat(applied[0].getVersion().toString()).isEqualTo("1");
        assertThat(applied[0].getDescription()).isEqualTo("test fixture");
    }

    @Test
    void flywaySchemaHistoryTableExistsInMySql() {
        Integer historyRows = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history", Integer.class);

        assertThat(historyRows).isEqualTo(1);
    }

    @Test
    void testFixtureTableWasActuallyCreated() {
        Integer fixtureRows = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_test_fixture", Integer.class);

        assertThat(fixtureRows).isZero(); // table exists and is queryable; starts empty
    }
}
