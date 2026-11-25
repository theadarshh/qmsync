package com.qmsync.tenant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.lang.annotation.Annotation;
import java.lang.reflect.AnnotatedElement;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link TenantScopedEntity} (T2 in the M1 decision report) and for the behavior of
 * {@link Tenant} that needs no database. No Spring context, no database, no persistence provider:
 * the JPA lifecycle callback is invoked directly, and the mapping annotations are checked by reflection.
 * Reflection proves what the source declares; it does not prove that Hibernate honors it.
 *
 * <p>These tests do NOT show tenant read isolation, because M1 has none.
 */
class TenantScopedEntityTest {

    /** Minimal concrete subclass: the production class is abstract and is never instantiated directly. */
    private static final class ScopedProbe extends TenantScopedEntity {
    }

    @AfterEach
    void clearContext() {
        TenantContext.clear();
    }

    @Test
    void stampingAssignsTheTenantIdFromTheContext() {
        TenantContext.set(11L);
        ScopedProbe entity = new ScopedProbe();
        assertThat(entity.getTenantId()).isNull();

        entity.stampTenantId();

        assertThat(entity.getTenantId()).isEqualTo(11L);
    }

    @Test
    void stampingWithoutATenantContextFailsExplicitlyAndLeavesTheEntityUnstamped() {
        ScopedProbe entity = new ScopedProbe();

        assertThatThrownBy(entity::stampTenantId).isInstanceOf(IllegalStateException.class);

        assertThat(entity.getTenantId()).isNull();
    }

    @Test
    void stampingOverwritesAPrePopulatedTenantId() throws ReflectiveOperationException {
        ScopedProbe entity = new ScopedProbe();
        setPrivateField(entity, TenantScopedEntity.class, "tenantId", 999L); // as if a caller had supplied one
        TenantContext.set(5L);

        entity.stampTenantId();

        assertThat(entity.getTenantId()).isEqualTo(5L);
    }

    @Test
    void thereIsNoSetTenantIdMethod() {
        // A naming-convention guard and nothing more: it fails if a method called setTenantId is declared in
        // TenantScopedEntity (any visibility, any parameters) or is inherited as a public method. It does NOT prove
        // that nothing else can change the field: a mutator with another name, or a non-public setTenantId inherited
        // from a superclass, would pass this test. The rest of the invariant is tested elsewhere: the field is private
        // and its column is updatable = false (tenantIdFieldIsPrivateAndMappedToANonNullableNonUpdatableColumn), and
        // the intended way to set the value, stampTenantId(), is covered by the stamping tests above. Methods that
        // take parameters, such as equals(Object), are deliberately not restricted.
        List<String> setters = new ArrayList<>();
        for (Method method : TenantScopedEntity.class.getDeclaredMethods()) {
            if (method.getName().equals("setTenantId")) {
                setters.add(method.toString());
            }
        }
        for (Method method : TenantScopedEntity.class.getMethods()) { // public methods, including inherited ones
            if (method.getName().equals("setTenantId")) {
                setters.add(method.toString());
            }
        }

        assertThat(setters).as("declared or public setTenantId methods").isEmpty();
    }

    @Test
    void tenantIdFieldIsPrivateAndMappedToANonNullableNonUpdatableColumn() throws NoSuchFieldException {
        Field field = TenantScopedEntity.class.getDeclaredField("tenantId");
        Column column = field.getAnnotation(Column.class);

        assertThat(Modifier.isPrivate(field.getModifiers())).isTrue();
        assertThat(column).as("@Column on tenantId").isNotNull();
        assertThat(column.name()).isEqualTo("tenant_id");
        assertThat(column.nullable()).isFalse();
        assertThat(column.updatable()).isFalse();
    }

    @Test
    void isAnAbstractMappedSuperclassAndNotAnEntity() {
        assertThat(TenantScopedEntity.class.isAnnotationPresent(MappedSuperclass.class)).isTrue();
        assertThat(TenantScopedEntity.class.isAnnotationPresent(Entity.class)).isFalse();
        assertThat(Modifier.isAbstract(TenantScopedEntity.class.getModifiers())).isTrue();
    }

    @Test
    void stampTenantIdIsTheOnlyPrePersistCallback() {
        List<String> callbacks = new ArrayList<>();
        for (Method method : TenantScopedEntity.class.getDeclaredMethods()) {
            if (method.isAnnotationPresent(PrePersist.class)) {
                callbacks.add(method.getName());
            }
        }

        assertThat(callbacks).containsExactly("stampTenantId");
    }

    @Test
    void declaresNoReadIsolationMechanismInM1() {
        // Decisions D1 (scope A) and D3: Hibernate filters, per-request enabling and a load-time tenant check are
        // deferred. This test pins that deferral. When they are approved and implemented, change it deliberately.
        List<String> annotationTypes = new ArrayList<>();
        collect(TenantScopedEntity.class, annotationTypes);
        for (Field field : TenantScopedEntity.class.getDeclaredFields()) {
            collect(field, annotationTypes);
        }
        for (Method method : TenantScopedEntity.class.getDeclaredMethods()) {
            collect(method, annotationTypes);
        }
        Package pkg = TenantScopedEntity.class.getPackage();
        if (pkg != null) {
            collect(pkg, annotationTypes);
        }

        assertThat(annotationTypes).noneMatch(name -> name.startsWith("org.hibernate.annotations.Filter"));
        assertThat(annotationTypes).noneMatch(name -> name.equals("jakarta.persistence.PostLoad"));
    }

    /** Unit-testable behavior of {@link Tenant}; the approved M1 scope has no separate TenantTest file. */
    @Nested
    class TenantEntity {

        @Test
        void onCreateStampsCreatedAtWithMicrosecondPrecision() {
            Tenant tenant = new Tenant("Acme");
            assertThat(tenant.getCreatedAt()).isNull();
            Instant before = Instant.now().truncatedTo(ChronoUnit.MICROS);

            tenant.onCreate();

            Instant after = Instant.now();
            Instant createdAt = tenant.getCreatedAt();
            assertThat(createdAt).isNotNull();
            assertThat(createdAt.getNano() % 1_000).as("sub-microsecond part of createdAt").isZero();
            assertThat(createdAt).isAfterOrEqualTo(before);
            assertThat(createdAt).isBeforeOrEqualTo(after);
        }

        @Test
        void onCreateOverwritesAnyCreatedAtAlreadyPresent() throws ReflectiveOperationException {
            Tenant tenant = new Tenant("Acme");
            setPrivateField(tenant, Tenant.class, "createdAt", Instant.EPOCH);

            tenant.onCreate();

            assertThat(tenant.getCreatedAt()).isAfter(Instant.EPOCH);
        }

        @Test
        void nameIsRequired() {
            assertThatThrownBy(() -> new Tenant(null)).isInstanceOf(NullPointerException.class);
        }

        @Test
        void isNotTenantScoped() {
            assertThat(TenantScopedEntity.class.isAssignableFrom(Tenant.class)).isFalse();
        }

        @Test
        void mappingDeclaresTheExpectedTableAndColumns() throws NoSuchFieldException {
            assertThat(Tenant.class.isAnnotationPresent(Entity.class)).isTrue();
            assertThat(Tenant.class.getAnnotation(Table.class).name()).isEqualTo("tenant");

            Field id = Tenant.class.getDeclaredField("id");
            assertThat(id.isAnnotationPresent(Id.class)).isTrue();
            assertThat(id.getAnnotation(GeneratedValue.class).strategy()).isEqualTo(GenerationType.IDENTITY);

            Column name = Tenant.class.getDeclaredField("name").getAnnotation(Column.class);
            assertThat(name.name()).isEqualTo("name");
            assertThat(name.nullable()).isFalse();
            assertThat(name.length()).isEqualTo(255);

            Column createdAt = Tenant.class.getDeclaredField("createdAt").getAnnotation(Column.class);
            assertThat(createdAt.name()).isEqualTo("created_at");
            assertThat(createdAt.nullable()).isFalse();
            assertThat(createdAt.updatable()).isFalse();
            assertThat(createdAt.columnDefinition()).isEqualTo("DATETIME(6)");
        }
    }

    private static void collect(AnnotatedElement element, List<String> into) {
        for (Annotation annotation : element.getAnnotations()) {
            into.add(annotation.annotationType().getName());
        }
    }

    private static void setPrivateField(Object target, Class<?> declaringClass, String name, Object value)
            throws ReflectiveOperationException {
        Field field = declaringClass.getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }
}
