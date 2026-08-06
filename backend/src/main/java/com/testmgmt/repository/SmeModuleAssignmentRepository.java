package com.testmgmt.repository;

import com.testmgmt.entity.SmeModuleAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SmeModuleAssignmentRepository extends JpaRepository<SmeModuleAssignment, UUID> {

    /** Find all module assignments for a specific SME */
    List<SmeModuleAssignment> findBySmeIdAndActiveTrue(UUID smeId);

    /** Find all SME assignments for a specific module */
    List<SmeModuleAssignment> findByModuleIdAndActiveTrue(UUID moduleId);

    /** Check if SME is assigned to a specific module */
    boolean existsBySmeIdAndModuleIdAndActiveTrue(UUID smeId, UUID moduleId);

    /** Find assignments by SME, channel, and department */
    List<SmeModuleAssignment> findBySmeIdAndChannelAndDepartmentAndActiveTrue(
            UUID smeId, String channel, String department);

    /** Find all module IDs assigned to an SME */
    @Query("SELECT sma.module.id FROM SmeModuleAssignment sma WHERE sma.sme.id = :smeId AND sma.active = true")
    List<UUID> findModuleIdsBySmeId(@Param("smeId") UUID smeId);

    /** Find all SME IDs assigned to a module */
    @Query("SELECT sma.sme.id FROM SmeModuleAssignment sma WHERE sma.module.id = :moduleId AND sma.active = true")
    List<UUID> findSmeIdsByModuleId(@Param("moduleId") UUID moduleId);

    /** Delete assignment */
    void deleteBySmeIdAndModuleId(UUID smeId, UUID moduleId);
}
