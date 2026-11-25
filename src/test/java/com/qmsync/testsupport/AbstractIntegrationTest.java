package com.qmsync.testsupport;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.MySQLContainer;

/**
 * Shared integration-test base. Every Phase 0 integration test extends this
 * class rather than each starting its own MySQL container.
 *
 * <p>The container is started exactly once per JVM, in the static
 * initializer below, and is deliberately never stopped explicitly --
 * Testcontainers' own Ryuk reaper cleans it up when the JVM exits. This is
 * the documented Testcontainers "singleton container" pattern, used
 * deliberately instead of {@code @Testcontainers}/{@code @Container}: that
 * combination only guarantees a container's lifecycle is scoped to ONE test
 * class -- started before it, stopped after it. Inheriting a static
 * {@code @Container} field into several subclasses does not make
 * Testcontainers aware they share it, so whichever class happens to finish
 * first stops the container out from under the other two, and Spring's
 * test-context cache can then hand a later class a cached
 * {@code ApplicationContext} still wired to that now-dead container.
 *
 * <p>Correct under Maven's default Surefire configuration specifically
 * because this project never overrides it: the default is one forked JVM,
 * reused across all test classes, so this class is loaded -- and the
 * static initializer below runs -- exactly once for the whole `mvn test`
 * run. If Surefire is ever reconfigured to fork a JVM per test class, this
 * assumption would need revisiting; nothing here does that.
 *
 * <p>{@code @ServiceConnection} still applies unchanged: it is Spring's own
 * mechanism for discovering a Testcontainers instance's connection details
 * and wiring them into the ApplicationContext, and is independent of
 * whatever starts and stops the container itself. No datasource properties
 * are configured anywhere for tests -- see src/test/resources/application.yml.
 *
 * <p>Uses the same MySQL 8.4 LTS line as docker-compose.yml, deliberately --
 * see the Phase 0 architecture decisions on why Compose and Testcontainers
 * stay independent of each other while still testing against the same
 * database line.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class AbstractIntegrationTest {

    @ServiceConnection
    static final MySQLContainer<?> MYSQL_CONTAINER = new MySQLContainer<>("mysql:8.4.10");

    static {
        MYSQL_CONTAINER.start();
    }
}
