package com.qmsync.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Generates a server-side correlation id for every HTTP request and makes it
 * available two ways: in SLF4J's MDC, so every log line written while
 * handling this request carries it automatically, and as the
 * {@code X-Request-Id} response header, so a client can reference it.
 *
 * <p>This is pure logging infrastructure -- it is not a tracing system and
 * does not touch a database or any business record. A client-supplied
 * {@code X-Request-Id} header is deliberately never read or trusted: doing
 * so would mean either sanitizing arbitrary input (a log-injection risk) or
 * letting a caller collide their id with another request's, for no benefit
 * at this stage. The id used for correlation is always generated here.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestCorrelationFilter extends OncePerRequestFilter {

    static final String MDC_KEY = "requestId";
    static final String RESPONSE_HEADER = "X-Request-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        String requestId = UUID.randomUUID().toString();
        response.setHeader(RESPONSE_HEADER, requestId);
        MDC.put(MDC_KEY, requestId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }
}
