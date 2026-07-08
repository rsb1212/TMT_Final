package com.testmgmt.controller;

import com.testmgmt.dto.request.CallDTOs.*;
import com.testmgmt.dto.response.ResponseDTOs.*;
import com.testmgmt.service.QACallService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/calls")
@RequiredArgsConstructor
@Tag(name = "QA Calls", description = "QA meeting and call management — schedule, track, and record minutes")
public class QACallController {

    private final QACallService callService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','SME')")
    @Operation(summary = "Schedule a new QA call/meeting")
    public ResponseEntity<ApiResponse<QACallResponse>> create(
            @Valid @RequestBody CreateCallRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(callService.create(req, userDetails.getUsername())));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','SME','TESTER')")
    @Operation(summary = "List calls for a project — optional filter by status or callType")
    public ResponseEntity<ApiResponse<Page<QACallResponse>>> list(
            @RequestParam UUID   projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String callType,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                callService.list(projectId, status, callType, page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','SME','TESTER','VIEWER')")
    @Operation(summary = "Get call detail by ID")
    public ResponseEntity<ApiResponse<QACallResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(callService.getById(id)));
    }

    @GetMapping("/upcoming")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','SME','TESTER')")
    @Operation(summary = "Get upcoming calls for a project (next 10)")
    public ResponseEntity<ApiResponse<List<QACallResponse>>> getUpcoming(
            @RequestParam UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(callService.getUpcoming(projectId)));
    }

    @GetMapping("/my-calls")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','SME','TESTER')")
    @Operation(summary = "Get calls where the current user is organiser or participant")
    public ResponseEntity<ApiResponse<List<QACallResponse>>> getMyCalls(
            @RequestParam UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                callService.getMyCallsForProject(projectId, userDetails.getUsername())));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','SME','TESTER')")
    @Operation(summary = "Call summary dashboard — counts by type/status + upcoming/recent lists")
    public ResponseEntity<ApiResponse<CallSummaryResponse>> getSummary(
            @RequestParam UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(callService.getSummary(projectId)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','SME')")
    @Operation(summary = "Update call details (title, agenda, time, participants, linked items)")
    public ResponseEntity<ApiResponse<QACallResponse>> update(
            @PathVariable UUID id,
            @RequestBody UpdateCallRequest req) {
        return ResponseEntity.ok(ApiResponse.success(callService.update(id, req)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','SME','TESTER')")
    @Operation(summary = "Update call status (SCHEDULED → IN_PROGRESS → COMPLETED / CANCELLED)")
    public ResponseEntity<ApiResponse<QACallResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestBody UpdateCallStatusRequest req) {
        return ResponseEntity.ok(ApiResponse.success(callService.updateStatus(id, req)));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','SME','TESTER')")
    @Operation(summary = "Mark call complete and save MoM, action items, decisions")
    public ResponseEntity<ApiResponse<QACallResponse>> complete(
            @PathVariable UUID id,
            @RequestBody CompleteCallRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                callService.complete(id, req, userDetails.getUsername())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "Delete a scheduled call (cannot delete completed calls)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        callService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Call deleted"));
    }
}
