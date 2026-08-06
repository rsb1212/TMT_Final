package com.testmgmt.controller;

import com.testmgmt.dto.request.CallNumberDTOs.*;
import com.testmgmt.dto.response.ResponseDTOs.*;
import com.testmgmt.service.CallNumberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Call Number Management.
 * Handles all call number CRUD operations and test case linking.
 */
@RestController
@RequestMapping("/api/call-numbers")
@RequiredArgsConstructor
public class CallNumberController {

    private final CallNumberService callNumberService;

    // ══════════════════════════════════════════════════════════════════════════
    // CREATE ENDPOINTS
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Create a new call number
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<CallNumberResponse>> create(
            @Valid @RequestBody CreateCallNumberRequest request) {
        CallNumberResponse response = callNumberService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Call number created successfully", response));
    }

    /**
     * Bulk create call numbers
     */
    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<CallNumberResponse>>> bulkCreate(
            @Valid @RequestBody BulkCreateCallNumbersRequest request) {
        List<CallNumberResponse> responses = callNumberService.bulkCreate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(responses.size() + " call numbers created", responses));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // READ ENDPOINTS
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Get call number by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CallNumberResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(callNumberService.getById(id)));
    }

    /**
     * Get call number by code within a project
     */
    @GetMapping("/by-code")
    public ResponseEntity<ApiResponse<CallNumberResponse>> getByCode(
            @RequestParam String code,
            @RequestParam UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(callNumberService.getByCode(code, projectId)));
    }

    /**
     * Get all call numbers for a project
     */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<CallNumberResponse>>> getByProject(
            @PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(callNumberService.getByProject(projectId)));
    }

    /**
     * Get call number tree (hierarchical) for a project
     */
    @GetMapping("/project/{projectId}/tree")
    public ResponseEntity<ApiResponse<CallNumberTreeResponse>> getTree(
            @PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(callNumberService.getTree(projectId)));
    }

    /**
     * Get only parent (root) call numbers for a project
     */
    @GetMapping("/project/{projectId}/parents")
    public ResponseEntity<ApiResponse<List<CallNumberResponse>>> getParents(
            @PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(callNumberService.getParentCallNumbers(projectId)));
    }

    /**
     * Get child call numbers for a parent
     */
    @GetMapping("/{parentId}/children")
    public ResponseEntity<ApiResponse<List<CallNumberResponse>>> getChildren(
            @PathVariable UUID parentId) {
        return ResponseEntity.ok(ApiResponse.success(callNumberService.getChildCallNumbers(parentId)));
    }

    /**
     * Search call numbers within a project
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<CallNumberResponse>>> search(
            @RequestParam UUID projectId,
            @RequestParam String query) {
        return ResponseEntity.ok(ApiResponse.success(callNumberService.search(projectId, query)));
    }

    /**
     * Global search across all projects
     */
    @GetMapping("/search/global")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<CallNumberResponse>>> searchGlobal(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(callNumberService.searchGlobal(query, page, size)));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // UPDATE ENDPOINTS
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Update a call number
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<CallNumberResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCallNumberRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Call number updated", 
                callNumberService.update(id, request)));
    }

    /**
     * Deactivate a call number (soft delete)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable UUID id) {
        callNumberService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.ok("Call number deactivated"));
    }

    /**
     * Reactivate a call number
     */
    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> activate(@PathVariable UUID id) {
        callNumberService.activate(id);
        return ResponseEntity.ok(ApiResponse.ok("Call number activated"));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TEST CASE LINKING ENDPOINTS
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Link test cases to a call number
     */
    @PostMapping("/link-test-cases")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SME')")
    public ResponseEntity<ApiResponse<Integer>> linkTestCases(
            @Valid @RequestBody LinkTestCasesRequest request) {
        int count = callNumberService.linkTestCases(request);
        return ResponseEntity.ok(ApiResponse.success(count + " test cases linked", count));
    }

    /**
     * Unlink test cases from call numbers
     */
    @PostMapping("/unlink-test-cases")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SME')")
    public ResponseEntity<ApiResponse<Integer>> unlinkTestCases(
            @RequestBody List<UUID> testCaseIds) {
        int count = callNumberService.unlinkTestCases(testCaseIds);
        return ResponseEntity.ok(ApiResponse.success(count + " test cases unlinked", count));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // BULK STATUS UPDATE ENDPOINT (Issue #1, #2)
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Bulk update test case statuses
     */
    @PostMapping("/bulk-status-update")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SME')")
    public ResponseEntity<ApiResponse<BulkStatusUpdateResponse>> bulkUpdateStatus(
            @Valid @RequestBody BulkStatusUpdateRequest request) {
        BulkStatusUpdateResponse response = callNumberService.bulkUpdateStatus(request);
        return ResponseEntity.ok(ApiResponse.success(
                response.getSuccessCount() + " updated, " + response.getFailureCount() + " failed",
                response));
    }
}
