package com.testmgmt.controller;

import com.testmgmt.dto.PdCrCallDTOs.*;
import com.testmgmt.dto.response.ResponseDTOs.ApiResponse;
import com.testmgmt.enums.PdCrCallStatus;
import com.testmgmt.enums.PdCrCallType;
import com.testmgmt.service.PdCrCallService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for the PD/CR Call tracking module + dashboard.
 * Base path: /api/v1/pdcr-calls
 */
@RestController
@RequestMapping("/api/v1/pdcr-calls")
@RequiredArgsConstructor
public class PdCrCallController {

    private final PdCrCallService service;

    // ── List (with filters) ──────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PdCrCallResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) PdCrCallType callType,
            @RequestParam(required = false) PdCrCallStatus status,
            @RequestParam(required = false) String owner,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                service.list(projectId, callType, status, owner, q, page, size)));
    }

    // ── Dashboard ────────────────────────────────────────────────────────────
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> dashboard(
            @RequestParam(required = false) UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(service.dashboard(projectId)));
    }

    // ── Get one ──────────────────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdCrCallResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    // ── Create ───────────────────────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SME')")
    public ResponseEntity<ApiResponse<PdCrCallResponse>> create(
            @Valid @RequestBody UpsertRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("PD/CR call created", service.create(req)));
    }

    // ── Update ───────────────────────────────────────────────────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SME')")
    public ResponseEntity<ApiResponse<PdCrCallResponse>> update(
            @PathVariable UUID id, @Valid @RequestBody UpsertRequest req) {
        return ResponseEntity.ok(ApiResponse.success("PD/CR call updated",
                service.update(id, req)));
    }

    // ── Delete (soft) ────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("PD/CR call deleted"));
    }
}
