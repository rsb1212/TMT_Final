package com.testmgmt.repository;

import com.testmgmt.entity.Project;
import com.testmgmt.entity.QACall;
import com.testmgmt.entity.User;
import com.testmgmt.enums.CallStatus;
import com.testmgmt.enums.CallType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface QACallRepository extends JpaRepository<QACall, UUID> {

    Page<QACall> findByProject(Project project, Pageable pageable);
    Page<QACall> findByProjectAndStatus(Project project, CallStatus status, Pageable pageable);
    Page<QACall> findByProjectAndCallType(Project project, CallType type, Pageable pageable);

    List<QACall> findByProject(Project project);
    List<QACall> findByProjectAndStatus(Project project, CallStatus status);

    /** Calls where the user is organiser or participant */
    @Query("SELECT DISTINCT c FROM QACall c LEFT JOIN c.participants p " +
           "WHERE c.project = :project AND (c.organiser = :user OR p = :user) " +
           "ORDER BY c.scheduledAt DESC")
    List<QACall> findByProjectAndInvolvedUser(@Param("project") Project project,
                                               @Param("user") User user);

    /** Upcoming calls (scheduled in future) */
    @Query("SELECT c FROM QACall c WHERE c.project = :project " +
           "AND c.status = 'SCHEDULED' AND c.scheduledAt > :now ORDER BY c.scheduledAt ASC")
    List<QACall> findUpcoming(@Param("project") Project project,
                               @Param("now") Instant now);

    /** Calls in a date range */
    @Query("SELECT c FROM QACall c WHERE c.project = :project " +
           "AND c.scheduledAt BETWEEN :from AND :to ORDER BY c.scheduledAt DESC")
    List<QACall> findInDateRange(@Param("project") Project project,
                                  @Param("from") Instant from,
                                  @Param("to") Instant to);

    long countByProject(Project project);
    long countByProjectAndStatus(Project project, CallStatus status);
    long countByProjectAndCallType(Project project, CallType type);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(c.code, 6) AS INTEGER)), 0) " +
           "FROM QACall c WHERE c.code LIKE 'CALL-%'")
    int findMaxCodeSequence();

    /** Calls by organiser */
    List<QACall> findByOrganiser(User organiser);

    /** Recent completed calls with minutes */
    @Query("SELECT c FROM QACall c WHERE c.project = :project AND c.status = 'COMPLETED' " +
           "AND c.minutes IS NOT NULL ORDER BY c.endedAt DESC")
    List<QACall> findRecentWithMinutes(@Param("project") Project project, Pageable pageable);
}
