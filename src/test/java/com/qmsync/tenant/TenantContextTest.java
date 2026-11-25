package com.qmsync.tenant;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link TenantContext} (T1 in the M1 decision report). No Spring context, no database.
 *
 * <p>TenantContext is a ThreadLocal holder, so every test clears it afterwards. Otherwise one test could
 * leak a tenant into the next test that happens to run on the same thread.
 */
class TenantContextTest {

    @AfterEach
    void clearContext() {
        TenantContext.clear();
    }

    @Test
    void getReturnsNullWhenNoTenantIsBound() {
        assertThat(TenantContext.get()).isNull();
    }

    @Test
    void setThenGetReturnsTheBoundTenantId() {
        TenantContext.set(42L);

        assertThat(TenantContext.get()).isEqualTo(42L);
    }

    @Test
    void setReplacesAPreviousBindingOnTheSameThread() {
        TenantContext.set(1L);
        TenantContext.set(2L);

        assertThat(TenantContext.get()).isEqualTo(2L);
    }

    @Test
    void getRequiredTenantIdReturnsTheBoundTenantId() {
        TenantContext.set(7L);

        assertThat(TenantContext.getRequiredTenantId()).isEqualTo(7L);
    }

    @Test
    void getRequiredTenantIdFailsExplicitlyWhenNoTenantIsBound() {
        assertThatThrownBy(TenantContext::getRequiredTenantId)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No tenant is bound");
    }

    @Test
    void clearRemovesTheBinding() {
        TenantContext.set(5L);

        TenantContext.clear();

        assertThat(TenantContext.get()).isNull();
        assertThatThrownBy(TenantContext::getRequiredTenantId).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void clearIsIdempotent() {
        TenantContext.clear(); // nothing bound yet
        TenantContext.clear(); // and again

        TenantContext.set(5L);
        TenantContext.clear();
        TenantContext.clear();

        assertThat(TenantContext.get()).isNull();
    }

    @Test
    void setRejectsNullAndLeavesTheExistingBindingUntouched() {
        TenantContext.set(9L);

        assertThatThrownBy(() -> TenantContext.set(null)).isInstanceOf(NullPointerException.class);

        assertThat(TenantContext.get()).isEqualTo(9L);
    }

    @Test
    void setRejectsNullWhenNothingIsBoundAndBindsNothing() {
        assertThatThrownBy(() -> TenantContext.set(null)).isInstanceOf(NullPointerException.class);

        assertThat(TenantContext.get()).isNull();
    }

    @Test
    void aValueSetInOneThreadIsNotVisibleInAnotherAndViceVersa() throws InterruptedException {
        TenantContext.set(1L);
        AtomicReference<Long> seenByOtherThread = new AtomicReference<>(-1L); // sentinel: -1 means "never ran"
        AtomicReference<Throwable> failureInOtherThread = new AtomicReference<>();

        Thread other = new Thread(() -> {
            try {
                seenByOtherThread.set(TenantContext.get()); // must be null: values are not inherited
                TenantContext.set(2L);                     // must not leak back into the test thread
            } catch (Throwable t) {
                failureInOtherThread.set(t);
            } finally {
                TenantContext.clear();
            }
        }, "tenant-context-test-other-thread");
        other.setDaemon(true); // if it can never be stopped, it must at least never keep the JVM alive after this test

        boolean finishedInTime = false;
        InterruptedException interruptedWhileWaiting = null; // set if THIS thread is interrupted while it waits
        other.start();
        try {
            other.join(10_000);
            finishedInTime = !other.isAlive();
        } catch (InterruptedException e) {
            interruptedWhileWaiting = e;
        }
        if (other.isAlive()) {
            // Timeout path, or this thread was interrupted: interrupt the child, then wait for it once more, bounded.
            other.interrupt();
            try {
                other.join(2_000);
            } catch (InterruptedException e) {
                // Interrupted again during the cleanup: stop waiting (the child has already been interrupted) and keep
                // the exception. The first one wins; a later one is attached to it as suppressed.
                if (interruptedWhileWaiting == null) {
                    interruptedWhileWaiting = e;
                } else {
                    interruptedWhileWaiting.addSuppressed(e);
                }
            }
        }
        if (interruptedWhileWaiting != null) {
            throw interruptedWhileWaiting; // never swallowed: the test ends with the exception that interrupted it
        }

        assertThat(finishedInTime).as("the other thread finished within the first join timeout").isTrue();
        assertThat(other.isAlive()).as("the other thread is not left running").isFalse();
        assertThat(failureInOtherThread.get()).isNull();
        assertThat(seenByOtherThread.get()).as("value visible to the other thread").isNull();
        assertThat(TenantContext.get()).as("value on the test thread").isEqualTo(1L);
    }
}
