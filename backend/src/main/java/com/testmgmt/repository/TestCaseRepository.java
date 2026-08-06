package com.testmgmt.repository;

import com.testmgmt.entity.CallNumber;
import com.testmgmt.entity.Module;
import com.testmgmt.entity.Project;
import com.testmgmt.entity.TestCase;
import com.testmgmt.entity.User;
import com.testmgmt.enums.Priority;
import com.testmgmt.enums.TestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TestCaseRepository extends JpaRepository<TestCase, UUID> {

    Page<TestCase> findByProject(Project project, Pageable pageable);
    Page<TestCase> findByProjectAndStatus(Project project, TestStatus status, Pageable pageable);
    Page<TestCase> findByProjectAndPriority(Project project, Priority priority, Pageable pageable);

    List<TestCase> findByProject(Project project);
    List<TestCase> findByProjectAndStatus(Project project, TestStatus status);
    List<TestCase> findByAssignedTo(User assignedTo);
    List<TestCase> findByAssignedToAndProject(User assignedTo, Project project);
    List<TestCase> findByStatusIn(List<TestStatus> statuses);

    Optional<TestCase> findByCode(String code);
    boolean existsByTitleAndProject(String title, Project project);

    // ── Count by project ──────────────────────────────────────────────────────
    long countByProject(Project project);
    long countByProjectAndStatus(Project project, TestStatus status);

    // ── Count by project + module (for module breakdown) ──────────────────────
    long countByProjectAndModule(Project project, Module module);
    long countByProjectAndModuleAndStatus(Project project, Module module, TestStatus status);

    @Query("SELECT COUNT(tc) FROM TestCase tc WHERE tc.project = :project AND tc.status IN :statuses")
    long countByProjectAndStatusIn(@Param("project") Project project,
                                   @Param("statuses") List<TestStatus> statuses);

    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 4) AS INTEGER)), 0) " +
                   "FROM test_cases WHERE code ~ '^TC-[0-9]+$'", nativeQuery = true)
    int findMaxCodeSequence();

    @Query("SELECT tc FROM TestCase tc WHERE tc.module.name = :moduleName " +
           "AND tc.status IN (com.testmgmt.enums.TestStatus.DRAFT, " +
           "com.testmgmt.enums.TestStatus.SME_APPROVED, " +
           "com.testmgmt.enums.TestStatus.PENDING_SME_REVIEW) " +
           "AND tc.assignedTo IS NULL " +
           "AND (:projectId IS NULL OR tc.project.id = :projectId)")
    List<TestCase> findSmeApprovedByModuleName(@Param("moduleName") String moduleName,
                                               @Param("projectId")  UUID projectId);

    @Query("SELECT tc FROM TestCase tc WHERE tc.assignedTo = :tester " +
           "AND (:projectId IS NULL OR tc.project.id = :projectId) " +
           "ORDER BY tc.createdAt DESC")
    List<TestCase> findByAssignedToWithProject(@Param("tester")    User tester,
                                               @Param("projectId") UUID projectId);

    @Query("SELECT tc FROM TestCase tc WHERE " +
           "(LOWER(tc.title) LIKE :q OR LOWER(tc.code) LIKE :q) " +
           "AND (:projectId IS NULL OR tc.project.id = :projectId)")
    List<TestCase> searchByQuery(@Param("q") String q,
                                 @Param("projectId") UUID projectId,
                                 Pageable pageable);

    @Query("SELECT tc FROM TestCase tc WHERE tc.isRegression = true " +
           "AND (:projectId IS NULL OR tc.project.id = :projectId)")
    List<TestCase> findRegressionCases(@Param("projectId") UUID projectId);

    @Query(value = "SELECT status, COUNT(*) FROM test_cases WHERE project_id = :projectId GROUP BY status",
           nativeQuery = true)
    List<Object[]> countAllStatusesForProject(@Param("projectId") UUID projectId);

    @Query(value = "SELECT project_id, status, COUNT(*) FROM test_cases " +
                   "WHERE project_id IN :projectIds GROUP BY project_id, status",
           nativeQuery = true)
    List<Object[]> countAllStatusesForProjects(@Param("projectIds") List<UUID> projectIds);

    @Query(value = "SELECT module_id, status, COUNT(*) FROM test_cases " +
                   "WHERE project_id = :projectId GROUP BY module_id, status",
           nativeQuery = true)
    List<Object[]> countAllStatusesPerModuleForProject(@Param("projectId") UUID projectId);

    @Query(value = "SELECT assigned_to_id, status, COUNT(*) FROM test_cases " +
                   "WHERE assigned_to_id IN :userIds GROUP BY assigned_to_id, status",
           nativeQuery = true)
    List<Object[]> countStatusesPerAssignee(@Param("userIds") List<UUID> userIds);

    @Query("SELECT tc.assignedTo.id, COUNT(tc) FROM TestCase tc " +
           "WHERE tc.status IN ('ASSIGNED', 'IN_PROGRESS') " +
           "AND tc.assignedTo IS NOT NULL GROUP BY tc.assignedTo.id")
    List<Object[]> countPendingPerTester();

    @Query("SELECT tc.createdBy.team, tc.status, COUNT(tc) FROM TestCase tc " +
           "WHERE tc.createdBy.team IS NOT NULL AND tc.createdBy.team <> '' " +
           "AND tc.project.id = :projectId " +
           "GROUP BY tc.createdBy.team, tc.status")
    List<Object[]> countStatusesByCreatorTeam(@Param("projectId") UUID projectId);

    // ── Call Number queries ───────────────────────────────────────────────────
    
    /** Count test cases by call number */
    long countByCallNumber(CallNumber callNumber);
    
    /** Count test cases in project that have a call number assigned */
    long countByProjectAndCallNumberIsNotNull(Project project);
    
    /** Find test cases by call number */
    List<TestCase> findByCallNumber(CallNumber callNumber);
    
    /** Find test cases by call number (paginated) */
    Page<TestCase> findByCallNumber(CallNumber callNumber, Pageable pageable);
    
    /** Find test cases by call number code (search) */
    @Query("SELECT tc FROM TestCase tc WHERE tc.callNumber.code LIKE CONCAT('%', :callNumberCode, '%') " +
           "AND (:projectId IS NULL OR tc.project.id = :projectId)")
    List<TestCase> findByCallNumberCode(@Param("callNumberCode") String callNumberCode,
                                         @Param("projectId") UUID projectId,
                                         Pageable pageable);
    
    /** Find test cases without call number for a project */
    List<TestCase> findByProjectAndCallNumberIsNull(Project project);
    
    /** Count by call number and status */
    long countByCallNumberAndStatus(CallNumber callNumber, TestStatus status);

    // ── Sorting by priority for execution (Issue #25, #26) ────────────────────
    
    /** Find test cases sorted by priority (CRITICAL first) */
    @Query("SELECT tc FROM TestCase tc WHERE tc.project.id = :projectId " +
           "AND tc.status IN :statuses " +
           "ORDER BY CASE tc.priority " +
           "WHEN com.testmgmt.enums.Priority.CRITICAL THEN 1 " +
           "WHEN com.testmgmt.enums.Priority.HIGH THEN 2 " +
           "WHEN com.testmgmt.enums.Priority.MEDIUM THEN 3 " +
           "WHEN com.testmgmt.enums.Priority.LOW THEN 4 " +
           "END ASC, tc.code ASC")
    List<TestCase> findByProjectSortedByPriority(@Param("projectId") UUID projectId,
                                                  @Param("statuses") List<TestStatus> statuses);
    
    /** Find test cases sorted by priority with pagination */
    @Query("SELECT tc FROM TestCase tc WHERE tc.project.id = :projectId " +
           "ORDER BY CASE tc.priority " +
           "WHEN com.testmgmt.enums.Priority.CRITICAL THEN 1 " +
           "WHEN com.testmgmt.enums.Priority.HIGH THEN 2 " +
           "WHEN com.testmgmt.enums.Priority.MEDIUM THEN 3 " +
           "WHEN com.testmgmt.enums.Priority.LOW THEN 4 " +
           "END ASC, tc.code ASC")
    Page<TestCase> findByProjectOrderByPriorityAsc(@Param("projectId") UUID projectId, Pageable pageable);

    // ── SME Module Dashboard queries ──────────────────────────────────────────

    /** Count test cases by module ID */
    long countByModuleId(UUID moduleId);

    /** Count test cases by module and assigned SME */
    @Query("SELECT COUNT(tc) FROM TestCase tc WHERE tc.module.id = :moduleId AND tc.assignedSme.id = :smeId")
    int countByModuleIdAndAssignedSmeId(@Param("moduleId") UUID moduleId, @Param("smeId") UUID smeId);

    /** Count test cases by module, assigned SME, and status */
    @Query("SELECT COUNT(tc) FROM TestCase tc WHERE tc.module.id = :moduleId " +
           "AND tc.assignedSme.id = :smeId AND tc.status = :status")
    int countByModuleIdAndAssignedSmeIdAndStatus(@Param("moduleId") UUID moduleId, 
                                                  @Param("smeId") UUID smeId,
                                                  @Param("status") TestStatus status);

    /** Find test cases by module and assigned SME */
    List<TestCase> findByModuleIdAndAssignedSmeId(UUID moduleId, UUID smeId);

    /** Find test cases by module IDs (for SME filtering) */
    @Query("SELECT tc FROM TestCase tc WHERE tc.module.id IN :moduleIds")
    List<TestCase> findByModuleIdIn(@Param("moduleIds") List<UUID> moduleIds);

    /** Find test cases pending review for an SME by module IDs */
    @Query("SELECT tc FROM TestCase tc WHERE tc.module.id IN :moduleIds " +
           "AND tc.status = com.testmgmt.enums.TestStatus.PENDING_SME_REVIEW " +
           "AND (tc.assignedSme.id = :smeId OR tc.assignedSme IS NULL)")
    List<TestCase> findPendingReviewByModuleIds(@Param("moduleIds") List<UUID> moduleIds,
                                                 @Param("smeId") UUID smeId);

    /** Find test cases pending sign-off for an SME by module IDs */
    @Query("SELECT tc FROM TestCase tc WHERE tc.module.id IN :moduleIds " +
           "AND tc.status = com.testmgmt.enums.TestStatus.SME_APPROVED " +
           "AND (tc.assignedSme.id = :smeId OR tc.assignedSme IS NULL)")
    List<TestCase> findPendingSignOffByModuleIds(@Param("moduleIds") List<UUID> moduleIds,
                                                  @Param("smeId") UUID smeId);

    /** Count by module and status (no SME filter - for dashboard totals) */
    @Query("SELECT tc.module.id, tc.status, COUNT(tc) FROM TestCase tc " +
           "WHERE tc.module.id IN :moduleIds GROUP BY tc.module.id, tc.status")
    List<Object[]> countStatusesByModuleIds(@Param("moduleIds") List<UUID> moduleIds);
}
