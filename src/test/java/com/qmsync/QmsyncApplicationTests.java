package com.qmsync;

import com.qmsync.testsupport.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;

/**
 * Proves the Spring application context starts cleanly against a real,
 * Flyway-migrated MySQL instance. No business logic exists yet to assert
 * against -- a clean startup is the entire claim this test makes.
 */
class QmsyncApplicationTests extends AbstractIntegrationTest {

    @Test
    void contextLoads() {
        // Intentionally empty. If the context fails to start, this test
        // fails with the underlying Spring startup exception -- that is
        // the assertion.
    }
}
