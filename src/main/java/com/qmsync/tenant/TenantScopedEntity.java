package com.qmsync.tenant;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;

/**
 * Base class for every entity that belongs to exactly one tenant.
 *
 * <p>What this class does (M1):
 * <ul>
 *   <li>adds a non-null, non-updatable {@code tenant_id} column to each subclass;</li>
 *   <li>stamps that column from {@link TenantContext#getRequiredTenantId()} when the entity is first
 *       persisted, overwriting any value already present on the instance, and fails explicitly if no
 *       tenant is bound to the thread;</li>
 *   <li>offers no setter, so the value cannot be changed through this class's API afterwards, and the
 *       column is excluded from {@code UPDATE} statements.</li>
 * </ul>
 *
 * <p><strong>What this class does NOT do: it provides no tenant read isolation.</strong> Nothing here
 * restricts which rows a query, a primary-key lookup, a native SQL statement or a bulk update or delete
 * can read or change, and nothing here proves that cross-tenant access is prevented. Stamping happens
 * only through the JPA {@code @PrePersist} callback, so bulk and native writes bypass it. Hibernate
 * filters, per-request enabling of them and a load-time tenant check are deliberately deferred (see
 * M1-TENANT-DECISION-REPORT.md, decisions D1 to D3). Until they exist and tests prove them, treat tenant
 * isolation as designed but not implemented.
 */
@MappedSuperclass
public abstract class TenantScopedEntity {

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private Long tenantId;

    /** The owning tenant's id; null until the entity has been persisted. There is intentionally no setter. */
    public Long getTenantId() {
        return tenantId;
    }

    /**
     * Stamps the owning tenant from {@link TenantContext}. Invoked by the persistence provider before the
     * entity is first persisted. It overwrites unconditionally: a tenant id supplied by a caller is never
     * trusted.
     *
     * @throws IllegalStateException if no tenant is bound to the current thread
     */
    @PrePersist
    protected void stampTenantId() {
        this.tenantId = TenantContext.getRequiredTenantId();
    }
}
