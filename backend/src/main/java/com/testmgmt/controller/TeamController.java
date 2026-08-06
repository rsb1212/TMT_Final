package com.testmgmt.controller;

import com.testmgmt.dto.response.ResponseDTOs.ApiResponse;
import com.testmgmt.service.TeamService;
import com.testmgmt.service.TeamService.TeamRequest;
import com.testmgmt.service.TeamService.TeamResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    /**
     * Get all teams for current tenant
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getAllTeams() {
        return ResponseEntity.ok(ApiResponse.success(teamService.getAllTeams()));
    }

    /**
     * Get teams with pagination
     */
    @GetMapping("/paged")
    public ResponseEntity<ApiResponse<Page<TeamResponse>>> getTeamsPaged(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getTeamsPaged(pageable)));
    }

    /**
     * Get team by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TeamResponse>> getTeamById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getTeamById(id)));
    }

    /**
     * Create a new team
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<TeamResponse>> createTeam(@RequestBody TeamRequest request) {
        return ResponseEntity.ok(ApiResponse.success(teamService.createTeam(request)));
    }

    /**
     * Update team
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<TeamResponse>> updateTeam(
            @PathVariable UUID id,
            @RequestBody TeamRequest request) {
        return ResponseEntity.ok(ApiResponse.success(teamService.updateTeam(id, request)));
    }

    /**
     * Delete team (soft delete)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteTeam(@PathVariable UUID id) {
        teamService.deleteTeam(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Get teams by department
     */
    @GetMapping("/by-department/{department}")
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getTeamsByDepartment(
            @PathVariable String department) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getTeamsByDepartment(department)));
    }

    /**
     * Get teams by channel
     */
    @GetMapping("/by-channel/{channel}")
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getTeamsByChannel(
            @PathVariable String channel) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getTeamsByChannel(channel)));
    }

    /**
     * Search teams
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<TeamResponse>>> searchTeams(
            @RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.success(teamService.searchTeams(q)));
    }

    /**
     * Get team member count
     */
    @GetMapping("/{id}/member-count")
    public ResponseEntity<ApiResponse<Long>> getTeamMemberCount(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getTeamMemberCount(id)));
    }
}
