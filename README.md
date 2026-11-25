# QMSync

Connected QMS platform for manufacturing organizations.

## Current stage

**Phase 0 -- Project Foundation.** This repository contains no business
logic. It exists to prove the technical foundation works: the application
starts, connects to MySQL, runs Flyway, and exposes a working health check.
No tenant, user, production, or QMS functionality exists yet.

## Prerequisites

- JDK 21
- Docker (with Docker Compose)

Maven itself is **not** a prerequisite -- the Maven Wrapper (`./mvnw`)
bootstraps it automatically.

## Running tests

```
./mvnw test
```

Tests use Testcontainers to start a real, disposable MySQL instance
automatically. You do not need `docker compose up` running first --
tests only require a working Docker daemon.

## Running with Docker

```
cp .env.example .env   # edit if you want different local values
docker compose up --build
```

This starts MySQL and the application together. The application waits for
MySQL to report healthy before starting.

## Running locally without Docker Compose for the app

```
docker compose up -d mysql
./mvnw spring-boot:run
```

## Health check

```
curl http://localhost:8080/actuator/health
```

Returns `UP` with a `db` component when both the application and MySQL are
reachable. If MySQL is unavailable, the endpoint still responds (the
application process is running) but reports a degraded status with the `db`
component `DOWN`. If there is no response at all, the application process
itself is not running.

## Database / Flyway behavior

Flyway is enabled and configured, but **no application migrations exist
yet** -- `src/main/resources/db/migration/` is intentionally empty. Phase 1
will add the first real migration there.

A test-only migration exists at
`src/test/resources/db/migration/V1__test_fixture.sql`, used solely to
prove the Flyway mechanism works against real MySQL. It is never part of
the application's schema and never runs outside the test suite.

## Project structure

```
src/main/java/com/qmsync/
  QmsyncApplication.java      Application entry point
  web/RequestCorrelationFilter.java   Per-request correlation id for logs

src/main/resources/
  application.yml              Single configuration file (no dev/docker profile split)

src/test/java/com/qmsync/
  testsupport/AbstractIntegrationTest.java   Shared Testcontainers MySQL instance
  QmsyncApplicationTests.java   Application context starts
  FlywayMigrationTest.java      Flyway mechanism, against real MySQL
  HealthEndpointTest.java       /actuator/health, against real MySQL

src/test/resources/
  db/migration/V1__test_fixture.sql   Test-only Flyway fixture
```

## Technology

Spring Boot 4.1.0, Java 21, MySQL 8.4 (LTS), Flyway, Testcontainers.
Spring Data JPA, Thymeleaf, Spring Security, and ArchUnit are deliberately
not present yet -- Phase 0 does not need them, and each arrives when the
phase that actually needs it does.
