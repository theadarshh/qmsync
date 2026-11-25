package com.qmsync.tenant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

/**
 * A tenant: the organization whose data every {@link TenantScopedEntity} belongs to.
 *
 * <p>A tenant is not itself "in" a tenant, so this class does not extend {@link TenantScopedEntity}.
 *
 * <p><strong>The mapping is unverified.</strong> No {@code tenant} table exists yet: M1 adds no production
 * migration (decision D4), and Hibernate never creates tables ({@code spring.jpa.hibernate.ddl-auto} is
 * {@code none}). The column definitions are explicit so that the first production migration can match them
 * exactly: {@code id} BIGINT identity primary key, {@code name} VARCHAR(255) NOT NULL, {@code created_at}
 * DATETIME(6) NOT NULL.
 *
 * <p>There is deliberately no repository and no service for tenants in M1.
 */
@Entity
@Table(name = "tenant")
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "DATETIME(6)")
    private Instant createdAt;

    /** Required by JPA; not for application code. */
    protected Tenant() {
    }

    public Tenant(String name) {
        this.name = Objects.requireNonNull(name, "name must not be null");
    }

    /**
     * Stamps the creation time, truncated to microseconds so the value round-trips exactly through a
     * DATETIME(6) column. Overwrites unconditionally: a caller cannot choose the creation time.
     */
    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now().truncatedTo(ChronoUnit.MICROS);
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
