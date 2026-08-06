package com.testmgmt.service;

import com.testmgmt.entity.Team;
import com.testmgmt.entity.Tenant;
import com.testmgmt.exception.ResourceNotFoundException;
import com.testmgmt.multitenancy.TenantContext;
import com.testmgmt.repository.TeamRepository;
import com.testmgmt.repository.TenantRepository;
import com.testmgmt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeamService {

    private final TeamRepository teamRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    private UUID getCurrentTenantId() {
        String tenantStr = TenantContext.getCurrentTenant();
        return tenantStr != null ? UUID.fromString(tenantStr) : null;
    }

    /**
     * Get all teams for the current tenant
     */
    @Transactional(readOnly = true)
    public List<TeamResponse> getAllTeams() {
        UUID tenantId = getCurrentTenantId();
        if (tenantId == null) {
            return List.of();
        }
        return teamRepository.findByTenantIdAndActiveTrueOrderBySortOrderAsc(tenantId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get teams with pagination
     */
    @Transactional(readOnly = true)
    public Page<TeamResponse> getTeamsPaged(Pageable pageable) {
        UUID tenantId = getCurrentTenantId();
        if (tenantId == null) {
            return Page.empty();
        }
        return teamRepository.findByTenantId(tenantId, pageable)
                .map(this::toResponse);
    }

    /**
     * Get team by ID
     */
    @Transactional(readOnly = true)
    public TeamResponse getTeamById(UUID teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", teamId));
        return toResponse(team);
    }

    /**
     * Create a new team
     */
    @Transactional
    public TeamResponse createTeam(TeamRequest request) {
        UUID tenantId = getCurrentTenantId();
        if (tenantId == null) {
            throw new IllegalStateException("No tenant context available");
        }

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));

        // Check for duplicate code
        if (teamRepository.existsByTenantIdAndCode(tenantId, request.getCode())) {
            throw new IllegalArgumentException("Team code already exists: " + request.getCode());
        }

        Team team = Team.builder()
                .tenant(tenant)
                .code(request.getCode().toUpperCase())
                .name(request.getName())
                .description(request.getDescription())
                .teamType(request.getTeamType())
                .department(request.getDepartment())
                .channel(request.getChannel())
                .leadId(request.getLeadId())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .active(true)
                .build();

        team = teamRepository.save(team);
        log.info("Created team: {} in tenant: {}", team.getCode(), tenantId);
        return toResponse(team);
    }

    /**
     * Update team
     */
    @Transactional
    public TeamResponse updateTeam(UUID teamId, TeamRequest request) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", teamId));

        if (request.getName() != null) {
            team.setName(request.getName());
        }
        if (request.getDescription() != null) {
            team.setDescription(request.getDescription());
        }
        if (request.getTeamType() != null) {
            team.setTeamType(request.getTeamType());
        }
        if (request.getDepartment() != null) {
            team.setDepartment(request.getDepartment());
        }
        if (request.getChannel() != null) {
            team.setChannel(request.getChannel());
        }
        if (request.getLeadId() != null) {
            team.setLeadId(request.getLeadId());
        }
        if (request.getSortOrder() != null) {
            team.setSortOrder(request.getSortOrder());
        }
        if (request.getActive() != null) {
            team.setActive(request.getActive());
        }

        team = teamRepository.save(team);
        log.info("Updated team: {}", team.getId());
        return toResponse(team);
    }

    /**
     * Delete team (soft delete - set inactive)
     */
    @Transactional
    public void deleteTeam(UUID teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", teamId));
        team.setActive(false);
        teamRepository.save(team);
        log.info("Deleted (deactivated) team: {}", teamId);
    }

    /**
     * Get teams by department
     */
    @Transactional(readOnly = true)
    public List<TeamResponse> getTeamsByDepartment(String department) {
        UUID tenantId = getCurrentTenantId();
        if (tenantId == null) {
            return List.of();
        }
        return teamRepository.findByTenantIdAndDepartmentAndActiveTrue(tenantId, department)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get teams by channel
     */
    @Transactional(readOnly = true)
    public List<TeamResponse> getTeamsByChannel(String channel) {
        UUID tenantId = getCurrentTenantId();
        if (tenantId == null) {
            return List.of();
        }
        return teamRepository.findByTenantIdAndChannelAndActiveTrue(tenantId, channel)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Search teams
     */
    @Transactional(readOnly = true)
    public List<TeamResponse> searchTeams(String query) {
        UUID tenantId = getCurrentTenantId();
        if (tenantId == null) {
            return List.of();
        }
        return teamRepository.searchByNameOrCode(tenantId, query)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get team member count
     */
    @Transactional(readOnly = true)
    public long getTeamMemberCount(UUID teamId) {
        return userRepository.countByTeamIdAndActiveTrue(teamId);
    }

    private TeamResponse toResponse(Team team) {
        long memberCount = userRepository.countByTeamIdAndActiveTrue(team.getId());
        String leadName = null;
        if (team.getLeadId() != null) {
            leadName = userRepository.findById(team.getLeadId())
                    .map(u -> u.getFullName())
                    .orElse(null);
        }

        return TeamResponse.builder()
                .id(team.getId())
                .tenantId(team.getTenant().getId())
                .tenantName(team.getTenant().getName())
                .code(team.getCode())
                .name(team.getName())
                .description(team.getDescription())
                .teamType(team.getTeamType())
                .department(team.getDepartment())
                .channel(team.getChannel())
                .leadId(team.getLeadId())
                .leadName(leadName)
                .memberCount(memberCount)
                .sortOrder(team.getSortOrder())
                .active(team.getActive())
                .createdAt(team.getCreatedAt())
                .build();
    }

    // DTO classes
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class TeamRequest {
        private String code;
        private String name;
        private String description;
        private String teamType;
        private String department;
        private String channel;
        private UUID leadId;
        private Integer sortOrder;
        private Boolean active;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class TeamResponse {
        private UUID id;
        private UUID tenantId;
        private String tenantName;
        private String code;
        private String name;
        private String description;
        private String teamType;
        private String department;
        private String channel;
        private UUID leadId;
        private String leadName;
        private long memberCount;
        private Integer sortOrder;
        private Boolean active;
        private java.time.Instant createdAt;
    }
}
