package com.testmgmt.repository;

import com.testmgmt.entity.CallNumber;
import com.testmgmt.entity.Project;
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
public interface CallNumberRepository extends JpaRepository<CallNumber, UUID> {

    // ── Find by Project ───────────────────────────────────────────────────────
    
    /** All call numbers for a project */
    List<CallNumber> findByProjectAndActiveTrue(Project project);
    
    /** All call numbers for a project (paginated) */
    Page<CallNumber> findByProjectAndActiveTrue(Project project, Pageable pageable);
    
    /** Only parent (root) call numbers for a project */
    List<CallNumber> findByProjectAndParentCallNumberIsNullAndActiveTrue(Project project);
    
    /** Only child call numbers for a parent */
    List<CallNumber> findByParentCallNumberAndActiveTrue(CallNumber parent);
    
    // ── Find by Code ──────────────────────────────────────────────────────────
    
    /** Find by code within a project */
    Optional<CallNumber> findByCodeAndProject(String code, Project project);
    
    /** Find by code (globally unique check) */
    Optional<CallNumber> findByCode(String code);
    
    /** Check if code exists in project */
    boolean existsByCodeAndProject(String code, Project project);
    
    // ── Search ────────────────────────────────────────────────────────────────
    
    /** Search by code or name (case-insensitive) */
    @Query("SELECT cn FROM CallNumber cn WHERE cn.project = :project AND cn.active = true " +
           "AND (LOWER(cn.code) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(cn.name) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<CallNumber> searchByCodeOrName(@Param("project") Project project, 
                                         @Param("query") String query);
    
    /** Search across all projects (for global search) */
    @Query("SELECT cn FROM CallNumber cn WHERE cn.active = true " +
           "AND (LOWER(cn.code) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(cn.name) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<CallNumber> searchGlobally(@Param("query") String query, Pageable pageable);
    
    // ── Counting ──────────────────────────────────────────────────────────────
    
    /** Count all active call numbers in a project */
    long countByProjectAndActiveTrue(Project project);
    
    /** Count parent call numbers in a project */
    long countByProjectAndParentCallNumberIsNullAndActiveTrue(Project project);
    
    /** Count child call numbers under a parent */
    long countByParentCallNumberAndActiveTrue(CallNumber parent);
    
    // ── Code Sequence ─────────────────────────────────────────────────────────
    
    /** Get max code sequence for auto-generating codes */
    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 6) AS INTEGER)), 0) " +
                   "FROM call_numbers WHERE code ~ '^CALL-[0-9]+$'", nativeQuery = true)
    int findMaxCodeSequence();
    
    // ── Hierarchy Queries ─────────────────────────────────────────────────────
    
    /** Get full tree for a project (ordered by sort order) */
    @Query("SELECT cn FROM CallNumber cn WHERE cn.project = :project AND cn.active = true " +
           "ORDER BY cn.parentCallNumber.id NULLS FIRST, cn.sortOrder ASC, cn.code ASC")
    List<CallNumber> findTreeByProject(@Param("project") Project project);
    
    /** Get all descendants of a parent call number */
    @Query("SELECT cn FROM CallNumber cn WHERE cn.parentCallNumber.id = :parentId AND cn.active = true " +
           "ORDER BY cn.sortOrder ASC, cn.code ASC")
    List<CallNumber> findChildrenByParentId(@Param("parentId") UUID parentId);
}
