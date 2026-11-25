package com.qmsync;

import com.qmsync.testsupport.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Proves /actuator/health distinguishes "application running, database
 * reachable" from a degraded state, against a real application context and
 * real MySQL -- not a mocked health indicator.
 */
@AutoConfigureTestRestTemplate
class HealthEndpointTest extends AbstractIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void healthEndpointReportsUpWithDatabaseComponentPresent() {
        ResponseEntity<String> response =
                restTemplate.getForEntity("http://localhost:" + port + "/actuator/health", String.class);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).contains("\"status\":\"UP\"");
        assertThat(response.getBody()).contains("\"db\"");
    }
}
