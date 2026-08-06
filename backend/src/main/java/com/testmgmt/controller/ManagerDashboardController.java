package com.testmgmt.controller;

import com.testmgmt.dto.response.ResponseDTOs.*;
import com.testmgmt.entity.SmeModuleAssignment;
import com.testmgmt.service.ManagerDashboardService;
import com.testmgmt.service.SMEDashboardService;
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
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Reports & Dashboard", description = "Manager dashboard and reporting endpoints")
public class ManagerDashboardController {

    private final ManagerDashboardService dashboardService;
    private final SMEDashboardService     smeDashboardService;

    @GetMapping("/manager-dashboard")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'TESTER', 'SME')")
    @Operation(summary = "Real-time dashboard for a project — used by manager AND tester views")
    public ResponseEntity<ApiResponse<ManagerDashboardResponse>> getDashboard(
            @RequestParam UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getDashboard(projectId)));
    }

    @GetMapping("/manager-dashboard/all")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Dashboard metrics for all active projects")
    public ResponseEntity<ApiResponse<List<ManagerDashboardResponse>>> getAllDashboards() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getAllProjectsDashboard()));
    }

    @GetMapping("/module-breakdown")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'TESTER', 'SME')")
    @Operation(summary = "Per-module status breakdown — Pass/Fail/In Progress/NA/Not Released")
    public ResponseEntity<ApiResponse<List<ModuleStatusSummary>>> getModuleBreakdown(
            @RequestParam UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getModuleBreakdown(projectId)));
    }

    @GetMapping("/sme-dashboard")
    @PreAuthorize("hasRole('SME')")
    @Operation(summary = "SME dashboard — department-wise test case bifurcation (NB & UW, IB, AG, etc.)")
    public ResponseEntity<ApiResponse<SMEDashboardResponse>> getSMEDashboard(
            @RequestParam UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(smeDashboardService.getSMEDashboard(projectId)));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SME MODULE-BASED DASHBOARD (from Chenges.md requirements)
    // ══════════════════════════════════════════════════════════════════════════

    @GetMapping("/sme-module-dashboard")
    @PreAuthorize("hasAnyRole('SME', 'MANAGER', 'ADMIN')")
    @Operation(summary = "SME module dashboard — shows only assigned modules with stats")
    public ResponseEntity<ApiResponse<SmeModuleDashboardResponse>> getSmeModuleDashboard(
            @RequestParam UUID smeId) {
        return ResponseEntity.ok(ApiResponse.success(smeDashboardService.getSmeModuleDashboard(smeId)));
    }

    @GetMapping("/sme-module-dashboard/my")
    @PreAuthorize("hasRole('SME')")
    @Operation(summary = "Get current SME's module dashboard")
    public ResponseEntity<ApiResponse<SmeModuleDashboardResponse>> getMyModuleDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        // We need to get SME ID from the authenticated user
        // This would require UserService injection - for now accept smeId as param
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/sme-modules/{smeId}")
    @PreAuthorize("hasAnyRole('SME', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Get all modules assigned to an SME")
    public ResponseEntity<ApiResponse<List<ModuleResponse>>> getAssignedModules(
            @PathVariable UUID smeId) {
        return ResponseEntity.ok(ApiResponse.success(smeDashboardService.getAssignedModules(smeId)));
    }

    @GetMapping("/module-smes/{moduleId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Get all SMEs assigned to a module")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAssignedSmes(
            @PathVariable UUID moduleId) {
        return ResponseEntity.ok(ApiResponse.success(smeDashboardService.getAssignedSmes(moduleId)));
    }

    @PostMapping("/sme-module-assignment")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Assign an SME to a module")
    public ResponseEntity<ApiResponse<SmeModuleAssignmentResponse>> assignSmeToModule(
            @RequestParam UUID smeId,
            @RequestParam UUID moduleId,
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) String department) {
        SmeModuleAssignment assignment = smeDashboardService.assignSmeToModule(smeId, moduleId, channel, department);
        return ResponseEntity.ok(ApiResponse.success(toAssignmentResponse(assignment)));
    }

    @DeleteMapping("/sme-module-assignment")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Remove an SME from a module")
    public ResponseEntity<ApiResponse<Void>> removeSmeFromModule(
            @RequestParam UUID smeId,
            @RequestParam UUID moduleId) {
        smeDashboardService.removeSmeFromModule(smeId, moduleId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    private SmeModuleAssignmentResponse toAssignmentResponse(SmeModuleAssignment a) {
        return SmeModuleAssignmentResponse.builder()
                .id(a.getId())
                .smeId(a.getSme().getId())
                .smeName(a.getSme().getFullName())
                .moduleId(a.getModule().getId())
                .moduleName(a.getModule().getName())
                .channel(a.getChannel())
                .department(a.getDepartment())
                .active(a.getActive())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
