# QMSync

**Connected Quality Management System for Manufacturing Organizations**

QMSync is an evolving manufacturing software platform designed to connect quality operations through structured digital workflows.

The long-term vision is to connect:

- Production Entry
- Rejection Management
- Non-Conformance Management (NCMR)
- Corrective and Preventive Actions (CAPA)
- Training Management
- Evidence Management
- Audit Management

The goal is to improve traceability, consistency, and visibility across manufacturing quality operations.

## Current Stage

**Phase 1 — M1: Tenant Foundation**

The initial backend foundation is implemented and running locally.

This milestone introduces:

- Spring Boot application foundation.
- MySQL database connectivity.
- Flyway migration infrastructure.
- Spring Data JPA and Hibernate integration.
- Initial tenant domain model.
- Tenant context and persistence-time tenant stamping foundation.
- Request correlation IDs for application logging.
- Docker-based application and database deployment.

**Important:** This is an early development foundation, not a completed QMS product. Authentication, complete tenant isolation, production database migrations, frontend screens, and manufacturing business workflows are still under development.

## Technology Stack

| Technology | Purpose |
|---|---|
| Java 21 | Backend language |
| Spring Boot 4.1.0 | Application framework |
| Spring Data JPA | Persistence abstraction |
| Hibernate 7.4.1 | ORM |
| MySQL 8.4 | Relational database |
| Flyway | Database migration management |
| Testcontainers | Integration testing |
| JUnit 5 | Automated testing |
| Docker | Containerization |
| Maven Wrapper | Build management |

## Project Structure

```text
qmsync/
├── .mvn/
│   └── wrapper/
├── src/
│   ├── main/
│   │   ├── java/com/qmsync/
│   │   │   ├── QmsyncApplication.java
│   │   │   ├── tenant/
│   │   │   │   ├── Tenant.java
│   │   │   │   ├── TenantContext.java
│   │   │   │   └── TenantScopedEntity.java
│   │   │   └── web/
│   │   │       └── RequestCorrelationFilter.java
│   │   └── resources/
│   │       └── application.yml
│   └── test/
│       ├── java/com/qmsync/
│       │   ├── testsupport/
│       │   ├── tenant/
│       │   ├── ConfigurationGuardTest.java
│       │   ├── FlywayMigrationTest.java
│       │   ├── HealthEndpointTest.java
│       │   ├── PersistenceConfigurationTest.java
│       │   └── QmsyncApplicationTests.java
│       └── resources/
│           ├── application.yml
│           └── db/migration/
│               └── V1__test_fixture.sql
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── mvnw
├── mvnw.cmd
└── pom.xml
```

## Prerequisites

- JDK 21
- Docker Desktop with Docker Compose
- Git (optional, for source control)

Maven does not need to be installed separately. The Maven Wrapper downloads and uses the configured Maven distribution.

## Configuration

Create a local environment file:

```cmd
copy .env.example .env
```

Update `.env` with your local database credentials.

Required variables:

```properties
DB_NAME=qmsync
DB_USERNAME=qmsync_app
DB_PASSWORD=your_local_password
DB_ROOT_PASSWORD=your_local_root_password
```

Never commit `.env` or expose database credentials.

## Running with Docker Compose

Build and start the application and database:

```cmd
docker compose up --build -d
```

Check container status:

```cmd
docker compose ps
```

The application runs on port `8080`.

MySQL is exposed on host port `3307` and listens on port `3306` inside the container. The application connects to MySQL through the internal Docker service network.

Stop the containers without deleting database data:

```cmd
docker compose down
```

The named MySQL volume preserves database data between container restarts.

## Running Tests

On Windows CMD:

```cmd
mvnw.cmd clean test
```

On Linux or macOS:

```bash
./mvnw clean test
```

Integration tests use Testcontainers to run against a real MySQL instance. A working Docker daemon is required.

**Current verification:** 38 tests passed, with zero failures, zero errors, and zero skipped tests.

## Building the Application

```cmd
mvnw.cmd clean package
```

The executable Spring Boot JAR is generated under:

```text
target/qmsync.jar
```

## Health Check

Check application health:

```cmd
curl http://localhost:8080/actuator/health
```

The endpoint reports application and database health.

A healthy response includes an overall `UP` status and a database component reporting `UP`.

## Database and Flyway

Flyway is enabled and owns database schema management.

Hibernate schema generation is explicitly disabled:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none
```

No production application migration has been introduced in the current milestone.

The migration at:

```text
src/test/resources/db/migration/V1__test_fixture.sql
```

is a test-only fixture used to verify Flyway integration against MySQL. It is not a production database migration.

## Multi-Tenancy Foundation

The current milestone introduces:

- `Tenant`: initial tenant entity.
- `TenantContext`: tenant context management using ThreadLocal.
- `TenantScopedEntity`: persistence-time tenant ID stamping.

This is only the initial foundation.

Tenant authentication, request-level tenant resolution, automatic tenant-filtered reads, cross-tenant access protection, and complete tenant isolation are not yet implemented.

## Current Development Status

| Capability | Status |
|---|---|
| Spring Boot backend foundation | Implemented |
| MySQL integration | Verified |
| Flyway infrastructure | Verified |
| Spring Data JPA integration | Implemented |
| Initial tenant foundation | Implemented |
| Request correlation filter | Implemented |
| Docker application deployment | Verified locally |
| Automated tests | 38 passed |
| React frontend | Not yet implemented |
| Authentication and authorization | Not yet implemented |
| Complete tenant isolation | Not yet implemented |
| Production QMS workflows | Not yet implemented |

## Development Philosophy

QMSync is being developed incrementally, with emphasis on:

- Modular architecture.
- Reliable database management.
- Tenant-aware design.
- Testable backend components.
- Traceable manufacturing quality workflows.
- Evidence-driven quality management.

The objective is to build a connected manufacturing QMS platform, one verified milestone at a time.

---

**Project:** QMSync  
**Repository:** https://github.com/theadarshh/qmsync
