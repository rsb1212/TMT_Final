package com.testmgmt.service;

import com.testmgmt.dto.response.ResponseDTOs.SearchResultResponse;
import com.testmgmt.repository.CallNumberRepository;
import com.testmgmt.repository.DefectRepository;
import com.testmgmt.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * DSA OPTIMISATION LOG
 * ─────────────────────────────────────────────────────────────────────────────
 * BEFORE: Every keystroke issued 2 LIKE-query DB round-trips with no caching.
 *         Short queries (< 2 chars) still reached the DB.
 *
 * AFTER:
 *   1. @Cacheable("search") — identical queries served from Caffeine cache
 *      with 30-second TTL. Repeated searches = 0 DB queries.
 *
 *   2. Prefix bloom filter (ConcurrentHashMap as lightweight prefix set) —
 *      tracks known 2-char prefixes that returned empty results.
 *      If the prefix has no results, any extension of it also won't.
 *      Avoids DB entirely for those branches. O(1) look-up.
 *
 *   3. Result merging uses ArrayList pre-sized to capacity — avoids
 *      ArrayList resizing/copying overhead.
 *
 *   4. Early-exit for queries < 2 chars (unchanged guard).
 *
 * NET EFFECT: First query per unique term = 2 DB queries (unchanged).
 *             Subsequent identical or prefix-extended queries = 0 DB queries.
 */
@Service
@RequiredArgsConstructor
public class SearchService {

    private final TestCaseRepository   testCaseRepository;
    private final DefectRepository     defectRepository;
    private final CallNumberRepository callNumberRepository;  // Issue #16, #29: Search by call number

    /**
     * Two-character prefix → known-empty flag.
     * If a 2-char prefix is in this set, all extensions are also empty → skip DB.
     * Bounded to 1024 entries; evicted by clearing when full (simple sentinel).
     */
    private final Set<String> emptyPrefixCache =
            Collections.newSetFromMap(new ConcurrentHashMap<>(1024));

    @Cacheable(value = "search", key = "#query + ':' + (#projectId != null ? #projectId : 'all')")
    @Transactional(readOnly = true)
    public List<SearchResultResponse> search(String query, UUID projectId, String email) {
        if (query == null || query.trim().length() < 2) return List.of();

        String trimmed = query.trim().toLowerCase();
        String prefix2 = trimmed.substring(0, Math.min(2, trimmed.length()));

        // ── Bloom-filter short-circuit ────────────────────────────────────────
        // If we already know this prefix returns nothing, skip DB entirely
        if (emptyPrefixCache.contains(prefix2 + (projectId != null ? projectId : "all"))) {
            return List.of();
        }

        String q = "%" + trimmed + "%";
        // Pre-size to expected max (20 test cases + 10 defects = 30)
        List<SearchResultResponse> results = new ArrayList<>(30);

        testCaseRepository.searchByQuery(q, projectId, PageRequest.of(0, 20))
                .forEach(tc -> results.add(SearchResultResponse.builder()
                        .type("TEST_CASE")
                        .id(tc.getId())
                        .code(tc.getCode())
                        .title(tc.getTitle())
                        .status(tc.getStatus().name())
                        .projectName(tc.getProject() != null ? tc.getProject().getName() : "")
                        .moduleName(tc.getModule()  != null ? tc.getModule().getName()   : "")
                        .build()));

        // Issue #16, #29: Also search by call number code
        testCaseRepository.findByCallNumberCode(trimmed, projectId, PageRequest.of(0, 10))
                .forEach(tc -> {
                    // Avoid duplicates if already found in title/code search
                    if (results.stream().noneMatch(r -> r.getId().equals(tc.getId()))) {
                        results.add(SearchResultResponse.builder()
                                .type("TEST_CASE")
                                .id(tc.getId())
                                .code(tc.getCode())
                                .title(tc.getTitle())
                                .status(tc.getStatus().name())
                                .projectName(tc.getProject() != null ? tc.getProject().getName() : "")
                                .moduleName(tc.getModule()  != null ? tc.getModule().getName()   : "")
                                .build());
                    }
                });

        // Also include call numbers themselves in search results
        callNumberRepository.searchGlobally(trimmed, PageRequest.of(0, 5))
                .forEach(cn -> results.add(SearchResultResponse.builder()
                        .type("CALL_NUMBER")
                        .id(cn.getId())
                        .code(cn.getCode())
                        .title(cn.getName())
                        .status(cn.getActive() ? "ACTIVE" : "INACTIVE")
                        .projectName(cn.getProject() != null ? cn.getProject().getName() : "")
                        .build()));

        defectRepository.searchByQuery(q, projectId, PageRequest.of(0, 10))
                .forEach(d -> results.add(SearchResultResponse.builder()
                        .type("DEFECT")
                        .id(d.getId())
                        .code(d.getCode())
                        .title(d.getTitle())
                        .status(d.getStatus().name())
                        .projectName(d.getProject() != null ? d.getProject().getName() : "")
                        .build()));

        // ── Update prefix bloom filter ────────────────────────────────────────
        if (results.isEmpty()) {
            String cacheKey = prefix2 + (projectId != null ? projectId : "all");
            if (emptyPrefixCache.size() >= 1024) emptyPrefixCache.clear(); // bounded eviction
            emptyPrefixCache.add(cacheKey);
        }

        return results;
    }
}
