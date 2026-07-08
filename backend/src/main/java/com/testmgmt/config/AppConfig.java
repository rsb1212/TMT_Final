package com.testmgmt.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Application-level bean configuration.
 *
 * Caffeine caches with per-cache TTL and capacity tuning.
 * Uses SimpleCacheManager so each cache gets its own Caffeine spec.
 *
 *   dashboard        — 60s TTL, 200 entries  (per-project aggregation)
 *   allDashboards    — 60s TTL, 10 entries   (full project list view)
 *   moduleBreakdown  — 120s TTL, 200 entries (changes infrequently)
 *   workload         — 30s TTL, 50 entries   (team workload, updated often)
 *   teamProductivity — 60s TTL, 50 entries   (analytics view)
 *   search           — 30s TTL, 500 entries  (per query+project combination)
 */
@Configuration
@EnableCaching
@EnableScheduling
public class AppConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.<org.springframework.cache.Cache>of(
            caffeine("dashboard",        60,  200),
            caffeine("allDashboards",    60,  10),
            caffeine("moduleBreakdown",  120, 200),
            caffeine("workload",         30,  50),
            caffeine("teamProductivity", 60,  50),
            caffeine("search",           30,  500)
        ));
        return manager;
    }

    private CaffeineCache caffeine(String name, int ttlSeconds, int maxSize) {
        return new CaffeineCache(name,
            Caffeine.newBuilder()
                .maximumSize(maxSize)
                .expireAfterWrite(ttlSeconds, TimeUnit.SECONDS)
                .recordStats()
                .build());
    }
}
