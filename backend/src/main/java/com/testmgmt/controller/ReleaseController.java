package com.testmgmt.controller;

import com.testmgmt.dto.request.WorkflowDTOs.ActionReleaseRequest;
import com.testmgmt.dto.request.WorkflowDTOs.ReleaseTestCaseRequest;
import com.testmgmt.dto.response.ResponseDTOs.ApiResponse;
import com.testmgmt.dto.response.ResponseDTOs.TestCaseReleaseResponse;
import com.testmgmt.service.ReleaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/releases")
@RequiredArgsConstructor
@Tag(name = "Release Management", description = "Tester release requests and manager approval workflow")
public class ReleaseController {

    private final ReleaseService releaseService;

    /** Tester: request to be released from an assigned test case */
    @PostMapping("/testcases/{testCaseId}/request")
    @PreAuthorize("hasAnyRole('TESTER','MANAGER','ADMIN')")
    @Operation(summary = "Request release from a test case (Tester)")
    public ResponseEntity<ApiResponse<TestCaseReleaseResponse>> requestRelease(
            @PathVariable UUID testCaseId,
            @RequestBody ReleaseTestCaseRequest request,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ApiResponse.success(
                releaseService.requestRelease(testCaseId, request, user.getUsername())));
    }

    /** Manager: approve or reject a release request */
    @PatchMapping("/{releaseId}/action")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "Approve or reject a release request (Manager/Admin)")
    public ResponseEntity<ApiResponse<TestCaseReleaseResponse>> actionRelease(
            @PathVariable UUID releaseId,
            @RequestBody ActionReleaseRequest request,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ApiResponse.success(
                releaseService.actionRelease(releaseId, request, user.getUsername())));
    }

    /** Manager: get all pending release requests */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "List all pending release requests (Manager inbox)")
    public ResponseEntity<ApiResponse<List<TestCaseReleaseResponse>>> getPending() {
        return ResponseEntity.ok(ApiResponse.success(releaseService.getPendingReleases()));
    }

    /** Any role: get release history for a specific test case */
    @GetMapping("/testcases/{testCaseId}/history")
    @PreAuthorize("hasAnyRole('TESTER','MANAGER','ADMIN','SME')")
    @Operation(summary = "Release history for a test case")
    public ResponseEntity<ApiResponse<List<TestCaseReleaseResponse>>> getHistory(
            @PathVariable UUID testCaseId) {
        return ResponseEntity.ok(ApiResponse.success(releaseService.getReleaseHistory(testCaseId)));
    }

    /** Tester: my own release requests */
    @GetMapping("/mine")
    @PreAuthorize("hasAnyRole('TESTER','MANAGER','ADMIN')")
    @Operation(summary = "My release requests (Tester view)")
    public ResponseEntity<ApiResponse<List<TestCaseReleaseResponse>>> getMine(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ApiResponse.success(releaseService.getMyReleases(user.getUsername())));
    }
}
