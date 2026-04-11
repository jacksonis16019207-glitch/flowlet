package com.example.flowlet.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class ApiClientErrorLoggingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(ApiClientErrorLoggingFilter.class);

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        filterChain.doFilter(request, response);

        int status = response.getStatus();
        if (status < 400 || status >= 500) {
            return;
        }

        logger.warn(
            "API client error: status={}, method={}, path={}, query={}, origin={}, referer={}, userAgent={}, host={}, xForwardedProto={}, xForwardedHost={}, xForwardedFor={}",
            status,
            request.getMethod(),
            request.getRequestURI(),
            request.getQueryString(),
            headerValue(request, "Origin"),
            headerValue(request, "Referer"),
            headerValue(request, "User-Agent"),
            headerValue(request, "Host"),
            headerValue(request, "X-Forwarded-Proto"),
            headerValue(request, "X-Forwarded-Host"),
            headerValue(request, "X-Forwarded-For")
        );
    }

    private String headerValue(HttpServletRequest request, String name) {
        String value = request.getHeader(name);
        return value == null || value.isBlank() ? "-" : value;
    }
}
