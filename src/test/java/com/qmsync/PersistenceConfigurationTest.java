package com.qmsync;

import com.qmsync.tenant.Tenant;
import com.qmsync.testsupport.AbstractIntegrationTest;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.metamodel.Attribute;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.ManagedType;
import org.flywaydb.core.Flyway;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;

import java.lang.annotation.Annotation;
import java.lang.reflect.AnnotatedElement;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.TreeSet;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test for M1's persistence configuration (T4 in the M1 decision report). Needs Maven and
 * Docker: AbstractIntegrationTest starts a Testcontainers MySQL instance.
 *
 * <p>Named {@code *Test}, not {@code *IT}, on purpose: the project configures no Failsafe plugin, so only
 * Surefire's default patterns run under {@code mvn test}, and an {@code *IT} class would never execute.
 *
 * <p>It proves that the JPA starter's EntityManagerFactory starts, that Hibernate does not own the schema,
 * that Tenant is mapped, that no Hibernate filter exists, that the test context runs without the main
 * application.yml (which is why ConfigurationGuardTest exists), and that Flyway still sees exactly the
 * Phase 0 fixture migration.
 *
 * <p>It does NOT prove tenant isolation. M1 has none, and the Tenant mapping stays unverified against a
 * database until a production migration creates the table.
 */
class PersistenceConfigurationTest extends AbstractIntegrationTest {

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Autowired
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private Environment environment;

    @Test
    void entityManagerFactoryStartsWithTheJpaStarter() {
        assertThat(entityManagerFactory.isOpen()).isTrue();
    }

    @Test
    void hibernateIsNotConfiguredToManageTheSchema() {
        Object ddlAuto = entityManagerFactory.getProperties().get("hibernate.hbm2ddl.auto");

        // Spring Boot leaves the property out when ddl-auto resolves to none. Any other value would mean
        // that Hibernate owns the schema.
        assertThat(ddlAuto == null || "none".equalsIgnoreCase(String.valueOf(ddlAuto)))
                .as("hibernate.hbm2ddl.auto was %s", ddlAuto)
                .isTrue();
    }

    @Test
    void hibernateCreatedNoTablesBeyondFlywaysOwn() {
        List<String> tables = jdbcTemplate.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()", String.class);

        // Flyway's history table plus Phase 0's test fixture table. Hibernate adds none: ddl-auto is none and M1
        // adds no production migration, so there is no tenant table. When the first production migration lands,
        // extend this expectation deliberately.
        assertThat(tables).containsExactlyInAnyOrder("flyway_schema_history", "flyway_test_fixture");
    }

    @Test
    void tenantIsMappedWithTheExpectedAttributes() {
        EntityType<Tenant> tenant = entityManagerFactory.getMetamodel().entity(Tenant.class);

        TreeSet<String> attributeNames = new TreeSet<>();
        for (Attribute<? super Tenant, ?> attribute : tenant.getAttributes()) {
            attributeNames.add(attribute.getName());
        }

        assertThat(attributeNames).containsExactlyInAnyOrder("id", "name", "createdAt");
        assertThat(tenant.getAttribute("id").getJavaType()).isEqualTo(Long.class);
        assertThat(tenant.getAttribute("name").getJavaType()).isEqualTo(String.class);
        assertThat(tenant.getAttribute("createdAt").getJavaType()).isEqualTo(Instant.class);
        assertThat(tenant.getId(Long.class).getName()).isEqualTo("id");
    }

    @Test
    void noHibernateFilterIsDefinedInThePersistenceUnit() throws ReflectiveOperationException {
        // (a) Annotation scan over every mapped type, its superclasses and their packages.
        List<String> annotationTypes = new ArrayList<>();
        for (ManagedType<?> type : entityManagerFactory.getMetamodel().getManagedTypes()) {
            for (Class<?> c = type.getJavaType(); c != null && c != Object.class; c = c.getSuperclass()) {
                collect(c, annotationTypes);
                for (Field field : c.getDeclaredFields()) {
                    collect(field, annotationTypes);
                }
                for (Method method : c.getDeclaredMethods()) {
                    collect(method, annotationTypes);
                }
                if (c.getPackage() != null) {
                    collect(c.getPackage(), annotationTypes);
                }
            }
        }
        assertThat(annotationTypes).noneMatch(name -> name.startsWith("org.hibernate.annotations.Filter"));

        // (b) Effective Hibernate state. SessionFactory#getDefinedFilterNames() is public API: the Hibernate 5.x
        // javadocs and the current stable javadoc both declare it on org.hibernate.SessionFactory. It is called
        // reflectively only because the Hibernate version that Spring Boot 4.1.0 resolves could not be established
        // offline (decision report A3 and A4). Once Maven can resolve dependencies, replace this with a direct
        // call. Until then, a missing method fails this one test at run time instead of breaking compilation.
        SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);
        Collection<?> filterNames =
                (Collection<?>) SessionFactory.class.getMethod("getDefinedFilterNames").invoke(sessionFactory);
        assertThat(filterNames.isEmpty()).as("defined Hibernate filter names: %s", filterNames).isTrue();
    }

    @Test
    void integrationTestContextDoesNotLoadTheMainApplicationYml() {
        // src/test/resources/application.yml shadows the main file (decision report F3). If either assertion
        // fails, that assumption no longer holds and ConfigurationGuardTest's rationale must be revisited.
        assertThat(environment.getProperty("spring.application.name")).isNull();
        assertThat(environment.getProperty("spring.jpa.hibernate.ddl-auto")).isNull();
    }

    @Test
    void flywayUsesTheBootDefaultLocationInTests() {
        List<String> locations = new ArrayList<>();
        for (var location : flyway.getConfiguration().getLocations()) {
            locations.add(String.valueOf(location));
        }

        assertThat(locations).containsExactly("classpath:db/migration");
    }

    @Test
    void onlyTheTestFixtureMigrationIsApplied() {
        var applied = flyway.info().applied();

        assertThat(applied).hasSize(1);
        assertThat(applied[0].getVersion().toString()).isEqualTo("1");
        assertThat(applied[0].getDescription()).isEqualTo("test fixture");
    }

    private static void collect(AnnotatedElement element, List<String> into) {
        for (Annotation annotation : element.getAnnotations()) {
            into.add(annotation.annotationType().getName());
        }
    }
}
