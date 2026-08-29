package com.testmgmt.controller;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Health check endpoint for monitoring and load balancer health checks.
 * Test Genii AI - Intelligent Test Knowledge & Management Platform
 */
@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @Value("${spring.application.name:Test Genii AI}")
    private String applicationName;

    @Value("${server.port:8080}")
    private String serverPort;

    private static final Instant START_TIME = Instant.now();
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter
            .ofPattern("yyyy-MM-dd HH:mm:ss z")
            .withZone(ZoneId.systemDefault());

    /**
     * Simple health check endpoint for load balancers and monitoring.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("application", applicationName);
        response.put("timestamp", FORMATTER.format(Instant.now()));
        response.put("uptime", getUptime());
        response.put("port", serverPort);
        response.put("version", "1.0.0");
        
        return ResponseEntity.ok(response);
    }

    /**
     * Detailed system info for monitoring dashboards.
     */
    @GetMapping("/health/info")
    public ResponseEntity<Map<String, Object>> healthInfo() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("application", applicationName);
        response.put("version", "1.0.0");
        response.put("timestamp", FORMATTER.format(Instant.now()));
        response.put("startTime", FORMATTER.format(START_TIME));
        response.put("uptime", getUptime());
        
        // Memory info
        Runtime runtime = Runtime.getRuntime();
        Map<String, Object> memory = new LinkedHashMap<>();
        memory.put("totalMB", runtime.totalMemory() / (1024 * 1024));
        memory.put("freeMB", runtime.freeMemory() / (1024 * 1024));
        memory.put("usedMB", (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024));
        memory.put("maxMB", runtime.maxMemory() / (1024 * 1024));
        response.put("memory", memory);
        
        // JVM info
        Map<String, Object> jvm = new LinkedHashMap<>();
        jvm.put("version", System.getProperty("java.version"));
        jvm.put("vendor", System.getProperty("java.vendor"));
        jvm.put("availableProcessors", runtime.availableProcessors());
        response.put("jvm", jvm);
        
        return ResponseEntity.ok(response);
    }

    private String getUptime() {
        long uptime = Instant.now().getEpochSecond() - START_TIME.getEpochSecond();
        long days = uptime / 86400;
        long hours = (uptime % 86400) / 3600;
        long minutes = (uptime % 3600) / 60;
        long seconds = uptime % 60;
        
        if (days > 0) {
            return String.format("%dd %dh %dm %ds", days, hours, minutes, seconds);
        } else if (hours > 0) {
            return String.format("%dh %dm %ds", hours, minutes, seconds);
        } else if (minutes > 0) {
            return String.format("%dm %ds", minutes, seconds);
        } else {
            return String.format("%ds", seconds);
        }
    }
}
