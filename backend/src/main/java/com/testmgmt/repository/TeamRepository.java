package com.testmgmt.repository;

import com.testmgmt.entity.Team;
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
public interface TeamRepository extends JpaRepository<Team, UUID> {

    /** Find all teams for a tenant */
    List<Team> findByTenantIdAndActiveTrueOrderBySortOrderAsc(UUID tenantId);

    /** Find all teams for a tenant with pagination */
    Page<Team> findByTenantId(UUID tenantId, Pageable pageable);

    /** Find team by code within a tenant */
    Optional<Team> findByTenantIdAndCode(UUID tenantId, String code);

    /** Find teams by department */
    List<Team> findByTenantIdAndDepartmentAndActiveTrue(UUID tenantId, String department);

    /** Find teams by channel */
    List<Team> findByTenantIdAndChannelAndActiveTrue(UUID tenantId, String channel);

    /** Find teams by type */
    List<Team> findByTenantIdAndTeamTypeAndActiveTrue(UUID tenantId, String teamType);

    /** Check if team code exists in tenant */
    boolean existsByTenantIdAndCode(UUID tenantId, String code);

    /** Count teams in a tenant */
    long countByTenantIdAndActiveTrue(UUID tenantId);

    /** Get team with tenant eagerly loaded */
    @Query("SELECT t FROM Team t JOIN FETCH t.tenant WHERE t.id = :id")
    Optional<Team> findByIdWithTenant(@Param("id") UUID id);

    /** Search teams by name */
    @Query("SELECT t FROM Team t WHERE t.tenant.id = :tenantId AND t.active = true " +
           "AND (LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(t.code) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Team> searchByNameOrCode(@Param("tenantId") UUID tenantId, @Param("search") String search);
}
