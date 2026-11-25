package com.qmsync.tenant;

import java.util.Objects;

/**
 * The tenant bound to the current thread.
 *
 * <p>This class is deliberately request-agnostic: it has no servlet, web or security dependency.
 * Whatever establishes the caller's tenant (a web filter, a background job, a test) calls
 * {@link #set(Long)} and <strong>must</strong> call {@link #clear()} in a {@code finally} block
 * when its unit of work ends. Threads are pooled, so a value that is not cleared leaks into
 * whatever work reuses the thread next.
 *
 * <p>The value is held in a plain {@link ThreadLocal}: it is confined to the thread that set it
 * and is not inherited by threads that thread creates.
 *
 * <p><strong>Scope (M1):</strong> this class and {@link TenantScopedEntity} provide a tenant
 * context and persistence-time tenant id stamping. They do <em>not</em> provide tenant read
 * isolation, and nothing here proves that cross-tenant access is prevented.
 */
public final class TenantContext {

    private static final ThreadLocal<Long> CURRENT = new ThreadLocal<>();

    private TenantContext() {
        // static holder; not instantiable
    }

    /**
     * Binds {@code tenantId} to the current thread, replacing any previous binding.
     *
     * @throws NullPointerException if {@code tenantId} is null; the existing binding is left
     *         untouched. To unbind, call {@link #clear()}.
     */
    public static void set(Long tenantId) {
        Long checked = Objects.requireNonNull(tenantId, "tenantId must not be null; call clear() to unbind");
        CURRENT.set(checked);
    }

    /** The tenant id bound to the current thread, or {@code null} if none is bound. */
    public static Long get() {
        return CURRENT.get();
    }

    /**
     * The tenant id bound to the current thread.
     *
     * @throws IllegalStateException if no tenant is bound. Code that needs a tenant must fail
     *         explicitly rather than carry on unscoped.
     */
    public static Long getRequiredTenantId() {
        Long tenantId = CURRENT.get();
        if (tenantId == null) {
            throw new IllegalStateException(
                    "No tenant is bound to the current thread; bind one with TenantContext.set(...) "
                            + "and clear it in a finally block");
        }
        return tenantId;
    }

    /** Unbinds the current thread's tenant. Safe to call when nothing is bound, and safe to repeat. */
    public static void clear() {
        CURRENT.remove();
    }
}
