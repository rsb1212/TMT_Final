package com.testmgmt.service;

import com.testmgmt.dto.response.ResponseDTOs.*;
import com.testmgmt.entity.Module;
import com.testmgmt.entity.Project;
import com.testmgmt.entity.SmeModuleAssignment;
import com.testmgmt.entity.User;
import com.testmgmt.enums.TestStatus;
import com.testmgmt.enums.UserRole;
import com.testmgmt.exception.ResourceNotFoundException;
import com.testmgmt.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * SME Dashboard — Department-wise and Module-wise test case bifurcation.
 *
 * Provides:
 * 1. Department-based view (by team field)
 * 2. Module-based view (for assigned modules only)
 * 3. Review stats and completion percentages
 */
@Service
@RequiredArgsConstructor
public class SMEDashboardService {

    private final ProjectRepository   projectRepository;
    private final TestCaseRepository  testCaseRepository;
    private final UserRepository      userRepository;
    private final ModuleRepository    moduleRepository;
    private final SmeModuleAssignmentRepository smeModuleRepo;

    // ══════════════════════════════════════════════════════════════════════════
    // DEPARTMENT-BASED DASHBOARD (existing functionality)
    // ══════════════════════════════════════════════════════════════════════════

    @Cacheable(value = "smeDashboard", key = "#projectId")
    @Transactional(readOnly = true)
    public SMEDashboardResponse getSMEDashboard(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        // Get all unique teams from users
        List<String> teams = userRepository.findDistinctTeams();

        // Get status counts grouped by creator team for this project
        List<Object[]> teamStatusRows = testCaseRepository.countStatusesByCreatorTeam(projectId);

        // Build a map: team -> Map<status, count>
        Map<String, Map<String, Long>> teamStatusMap = new HashMap<>();
        for (Object[] row : teamStatusRows) {
            String team   = (String) row[0];
            String status = (String) row[1];
            long   count  = ((Number) row[2]).longValue();
            teamStatusMap.computeIfAbsent(team, k -> new HashMap<>())
                         .merge(status, count, Long::sum);
        }

        // Build department summaries
        List<SMEDepartmentSummary> summaries = new ArrayList<>();
        long totalAllCases = 0;
        long totalPendingReview = 0;
        long totalSmeApproved = 0;
        long totalDraft = 0;

        for (String team : teams) {
            Map<String, Long> statusCounts = teamStatusMap.getOrDefault(team, new HashMap<>());

            long total     = statusCounts.values().stream().mapToLong(Long::longValue).sum();
            long pending   = statusCounts.getOrDefault(TestStatus.PENDING_SME_REVIEW.name(), 0L)
                          + statusCounts.getOrDefault(TestStatus.SME_REVIEWING.name(), 0L);
            long approved  = statusCounts.getOrDefault(TestStatus.SME_APPROVED.name(), 0L);
            long draft     = statusCounts.getOrDefault(TestStatus.DRAFT.name(), 0L);
            long changes   = statusCounts.getOrDefault(TestStatus.DRAFT.name(), 0L);
            long inProg    = statusCounts.getOrDefault(TestStatus.IN_PROGRESS.name(), 0L);
            long passed    = statusCounts.getOrDefault(TestStatus.PASSED.name(), 0L);
            long failed    = statusCounts.getOrDefault(TestStatus.FAILED.name(), 0L);

            long executed  = passed + failed;
            double passRate = executed > 0
                    ? Math.round((double) passed / executed * 10000.0) / 100.0 : 0.0;

            // Get SME users in this department
            List<UserResponse> smeUsers = userRepository.findByTeamAndRole(team, UserRole.SME)
                    .stream().map(this::toUserResponse).toList();

            if (total == 0) continue;

            summaries.add(SMEDepartmentSummary.builder()
                    .departmentName(team)
                    .totalCases(total)
                    .pendingReview(pending)
                    .smeApproved(approved)
                    .draftCases(draft)
                    .changesRequested(changes)
                    .inProgress(inProg)
                    .passed(passed)
                    .failed(failed)
                    .passRate(passRate)
                    .smeUsers(smeUsers)
                    .build());

            totalAllCases += total;
            totalPendingReview += pending;
            totalSmeApproved += approved;
            totalDraft += draft;
        }

        summaries.sort((a, b) -> Long.compare(b.getTotalCases(), a.getTotalCases()));

        return SMEDashboardResponse.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .departmentSummaries(summaries)
                .totalAllCases(totalAllCases)
                .totalPendingReview(totalPendingReview)
                .totalSmeApproved(totalSmeApproved)
                .totalDraft(totalDraft)
                .build();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MODULE-BASED SME DASHBOARD (new functionality from Chenges.md)
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Get module-wise dashboard for an SME - shows only their assigned modules.
     */
    @Transactional(readOnly = true)
    public SmeModuleDashboardResponse getSmeModuleDashboard(UUID smeId) {
        User sme = userRepository.findById(smeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", smeId));

        // Get assigned modules
        List<SmeModuleAssignment> assignments = smeModuleRepo.findBySmeIdAndActiveTrue(smeId);
        List<UUID> moduleIds = assignments.stream()
                .map(a -> a.getModule().getId())
                .collect(Collectors.toList());

        if (moduleIds.isEmpty()) {
            return SmeModuleDashboardResponse.builder()
                    .smeId(smeId)
                    .smeName(sme.getFullName())
                    .totalAssignedModules(0)
                    .moduleStats(Collections.emptyList())
                    .totalTestCases(0)
                    .totalPendingReview(0)
                    .totalPendingSignOff(0)
                    .totalReviewed(0)
                    .totalSignedOff(0)
                    .overallCompletionPercentage(0)
                    .build();
        }

        // Get status counts per module
        List<Object[]> statusRows = testCaseRepository.countStatusesByModuleIds(moduleIds);
        Map<UUID, Map<String, Long>> moduleStatusMap = new HashMap<>();
        for (Object[] row : statusRows) {
            UUID modId = (UUID) row[0];
            String status = row[1].toString();
            long count = ((Number) row[2]).longValue();
            moduleStatusMap.computeIfAbsent(modId, k -> new HashMap<>())
                           .put(status, count);
        }

        // Build module stats
        List<SmeModuleStats> moduleStatsList = new ArrayList<>();
        long totalTestCases = 0;
        long totalPendingReview = 0;
        long totalPendingSignOff = 0;
        long totalReviewed = 0;
        long totalSignedOff = 0;

        for (SmeModuleAssignment assignment : assignments) {
            Module module = assignment.getModule();
            Map<String, Long> statusCounts = moduleStatusMap.getOrDefault(module.getId(), new HashMap<>());

            long total = statusCounts.values().stream().mapToLong(Long::longValue).sum();
            long pendingReview = statusCounts.getOrDefault(TestStatus.PENDING_SME_REVIEW.name(), 0L);
            long reviewing = statusCounts.getOrDefault(TestStatus.SME_REVIEWING.name(), 0L);
            long approved = statusCounts.getOrDefault(TestStatus.SME_APPROVED.name(), 0L);
            long signedOff = statusCounts.getOrDefault(TestStatus.SIGNED_OFF.name(), 0L);

            long reviewed = reviewing + approved + signedOff;
            long pendingSignOff = approved;

            double completionPct = total > 0 ? ((double) signedOff / total) * 100 : 0;

            moduleStatsList.add(SmeModuleStats.builder()
                    .moduleId(module.getId())
                    .moduleName(module.getName())
                    .channel(module.getChannel())
                    .department(module.getDepartment())
                    .totalTestCases((int) total)
                    .pendingReview((int) pendingReview)
                    .pendingSignOff((int) pendingSignOff)
                    .reviewed((int) reviewed)
                    .signedOff((int) signedOff)
                    .completionPercentage(Math.round(completionPct * 100.0) / 100.0)
                    .build());

            totalTestCases += total;
            totalPendingReview += pendingReview;
            totalPendingSignOff += pendingSignOff;
            totalReviewed += reviewed;
            totalSignedOff += signedOff;
        }

        double overallCompletion = totalTestCases > 0 
            ? ((double) totalSignedOff / totalTestCases) * 100 : 0;

        return SmeModuleDashboardResponse.builder()
                .smeId(smeId)
                .smeName(sme.getFullName())
                .totalAssignedModules(moduleIds.size())
                .moduleStats(moduleStatsList)
                .totalTestCases((int) totalTestCases)
                .totalPendingReview((int) totalPendingReview)
                .totalPendingSignOff((int) totalPendingSignOff)
                .totalReviewed((int) totalReviewed)
                .totalSignedOff((int) totalSignedOff)
                .overallCompletionPercentage(Math.round(overallCompletion * 100.0) / 100.0)
                .build();
    }

    /**
     * Assign SME to a module.
     */
    @Transactional
    @CacheEvict(value = "smeDashboard", allEntries = true)
    public SmeModuleAssignment assignSmeToModule(UUID smeId, UUID moduleId, String channel, String department) {
        if (smeModuleRepo.existsBySmeIdAndModuleIdAndActiveTrue(smeId, moduleId)) {
            throw new IllegalArgumentException("SME is already assigned to this module");
        }

        User sme = userRepository.findById(smeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", smeId));
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module", moduleId));

        SmeModuleAssignment assignment = SmeModuleAssignment.builder()
                .sme(sme)
                .module(module)
                .channel(channel)
                .department(department)
                .active(true)
                .build();

        return smeModuleRepo.save(assignment);
    }

    /**
     * Remove SME from a module.
     */
    @Transactional
    @CacheEvict(value = "smeDashboard", allEntries = true)
    public void removeSmeFromModule(UUID smeId, UUID moduleId) {
        smeModuleRepo.deleteBySmeIdAndModuleId(smeId, moduleId);
    }

    /**
     * Get all modules assigned to an SME.
     */
    @Transactional(readOnly = true)
    public List<ModuleResponse> getAssignedModules(UUID smeId) {
        return smeModuleRepo.findBySmeIdAndActiveTrue(smeId).stream()
                .map(a -> toModuleResponse(a.getModule()))
                .collect(Collectors.toList());
    }

    /**
     * Get all SMEs assigned to a module.
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getAssignedSmes(UUID moduleId) {
        return smeModuleRepo.findByModuleIdAndActiveTrue(moduleId).stream()
                .map(a -> toUserResponse(a.getSme()))
                .collect(Collectors.toList());
    }

    /**
     * Check if SME has access to a module.
     */
    public boolean hasSmeAccessToModule(UUID smeId, UUID moduleId) {
        return smeModuleRepo.existsBySmeIdAndModuleIdAndActiveTrue(smeId, moduleId);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ══════════════════════════════════════════════════════════════════════════

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .team(user.getTeam())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private ModuleResponse toModuleResponse(Module module) {
        return ModuleResponse.builder()
                .id(module.getId())
                .name(module.getName())
                .projectId(module.getProject().getId())
                .projectName(module.getProject().getName())
                .parentModuleId(module.getParentModule() != null ? module.getParentModule().getId() : null)
                .parentModuleName(module.getParentModule() != null ? module.getParentModule().getName() : null)
                .build();
    }
}
