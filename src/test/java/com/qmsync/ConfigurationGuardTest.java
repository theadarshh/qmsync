package com.qmsync;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.io.UrlResource;

import java.io.IOException;
import java.net.URL;
import java.security.CodeSource;
import java.util.Collections;
import java.util.List;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pins settings in the MAIN {@code application.yml} (T3 in the M1 decision report). This is a plain unit
 * test: no Spring context, no database.
 *
 * <p>Why it exists: src/test/resources/application.yml has the same name as the main file and comes first on
 * the test classpath, so Spring Boot integration tests never load the main file at all. A setting that lives
 * only in the main file could be changed without any integration test noticing. This test reads the main
 * file directly: it lists every {@code application.yml} on the classpath and keeps the one that lives under
 * the classpath root of the production classes (target/classes under Maven).
 *
 * <p>Why by classpath root and not by a directory name such as test-classes: in four of the seven layouts listed
 * below (the two that add a third-party jar, the IDE-style layout and the one with a sibling directory) a
 * name-based filter selected two files, while the root-based selection chose exactly the main file in all seven.
 *
 * <p>Layouts exercised so far by a JVM-level probe (plain {@code java -cp} runs, NOT Maven Surefire itself):
 * <ol>
 *   <li>a plain classpath of target/test-classes and target/classes;</li>
 *   <li>the same, plus a third-party jar that ships its own application.yml;</li>
 *   <li>a Surefire-style manifest-only jar (Class-Path of file: URLs), plus that third-party jar;</li>
 *   <li>an IDE-style layout (out/production and out/test, no directory named test-classes);</li>
 *   <li>a plain classpath whose directory names contain spaces;</li>
 *   <li>a sibling directory target/classes-extra that also holds an application.yml;</li>
 *   <li>a manifest-only jar with percent-encoded Class-Path entries and spaces in the path.</li>
 * </ol>
 * Layouts known NOT to work: classes and resources in different directories (Gradle's build/classes/java/main
 * and build/resources/main), and main code packaged in a jar. There the root matches no application.yml and the
 * test fails with a message that lists every application.yml it found. Not tested, so not claimed: real Maven
 * Surefire runs (including its other class-loading modes), Failsafe, Windows paths and the module path.
 *
 * <p>YamlPropertiesFactoryBean needs SnakeYAML on the test runtime classpath. Spring Boot needs it as well in
 * order to read any application.yml, so this adds no new requirement.
 */
class ConfigurationGuardTest {

    private static Properties mainApplicationYml() throws IOException {
        CodeSource codeSource = QmsyncApplication.class.getProtectionDomain().getCodeSource();
        assertThat(codeSource).as("code source of QmsyncApplication").isNotNull();
        URL mainRoot = codeSource.getLocation();

        List<URL> all = Collections.list(ConfigurationGuardTest.class.getClassLoader().getResources("application.yml"));
        List<URL> main = all.stream().filter(url -> url.toString().startsWith(mainRoot.toString())).toList();
        assertThat(main)
                .as("application.yml resources under the main classes root %s (all application.yml resources found: %s)",
                        mainRoot, all)
                .hasSize(1);

        YamlPropertiesFactoryBean yaml = new YamlPropertiesFactoryBean();
        yaml.setResources(new UrlResource(main.get(0)));
        Properties properties = yaml.getObject();
        assertThat(properties).as("parsed main application.yml").isNotNull();
        return properties;
    }

    /** Reads the raw value rather than getProperty: a YAML boolean such as {@code true} may be held as a Boolean. */
    private static String requiredValue(Properties properties, String key) {
        Object raw = properties.get(key);
        assertThat(raw).as("value of %s in the main application.yml", key).isNotNull();
        return raw.toString();
    }

    @Test
    void mainApplicationYmlKeepsHibernateOutOfSchemaManagement() throws IOException {
        assertThat(requiredValue(mainApplicationYml(), "spring.jpa.hibernate.ddl-auto")).isEqualTo("none");
    }

    @Test
    void mainApplicationYmlKeepsFlywayEnabled() throws IOException {
        assertThat(requiredValue(mainApplicationYml(), "spring.flyway.enabled")).isEqualTo("true");
    }
}
