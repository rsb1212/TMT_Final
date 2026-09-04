package com.testmgmt.repository;

import com.testmgmt.entity.PdCrCall;
import com.testmgmt.enums.PdCrCallStatus;
import com.testmgmt.enums.PdCrCallType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PdCrCallRepository extends JpaRepository<PdCrCall, UUID> {

    Optional<PdCrCall> findByChildCallIdAndProjectId(String childCallId, UUID projectId);

    List<PdCrCall> findByActiveTrue();

    Page<PdCrCall> findByActiveTrue(Pageable pageable);

    List<PdCrCall> findByProjectIdAndActiveTrue(UUID projectId);

    /**
     * Flexible, null-friendly filter used by the list endpoint. Any of the
     * filter params may be null to mean "don't filter on this field".
     */
    @Query("""
            SELECT c FROM PdCrCall c
            WHERE c.active = true
              AND (:projectId IS NULL OR c.project.id = :projectId)
              AND (:callType  IS NULL OR c.callType   = :callType)
              AND (:status    IS NULL OR c.status     = :status)
              AND (:owner     IS NULL OR LOWER(c.applicationOwner) = LOWER(:owner))
              AND (:q IS NULL OR
                   LOWER(c.childCallId)      LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(c.issueDescription) LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(c.uatSpoc)          LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<PdCrCall> search(@Param("projectId") UUID projectId,
                          @Param("callType") PdCrCallType callType,
                          @Param("status") PdCrCallStatus status,
                          @Param("owner") String owner,
                          @Param("q") String q,
                          Pageable pageable);

    long countByActiveTrue();

    long countByActiveTrueAndCallType(PdCrCallType callType);

    long countByActiveTrueAndStatus(PdCrCallStatus status);
}
