package com.qmsync;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * QMSync application entry point.
 *
 * Phase 0 only: this class carries no business logic. Everything the
 * application currently does -- serving the health endpoint, connecting to
 * MySQL, running Flyway -- comes from Spring Boot auto-configuration plus
 * {@code application.yml}, not from custom configuration here.
 */
@SpringBootApplication
public class QmsyncApplication {

    public static void main(String[] args) {
        SpringApplication.run(QmsyncApplication.class, args);
    }
}
