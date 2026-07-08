package com.testmgmt.repository;

import com.testmgmt.entity.TestCase;
import com.testmgmt.entity.TestCaseRelease;
import com.testmgmt.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TestCaseReleaseRepository extends JpaRepository<TestCaseRelease, UUID> {

    List<TestCaseRelease> findByTestCaseOrderByRequestedAtDesc(TestCase testCase);

    List<TestCaseRelease> findByRequestedByOrderByRequestedAtDesc(User tester);

    /** All PENDING release requests — for manager inbox */
    List<TestCaseRelease> findByStatusOrderByRequestedAtAsc(String status);

    /** Pending releases for a specific test case (should be at most 1) */
    Optional<TestCaseRelease> findByTestCaseAndStatus(TestCase testCase, String status);

    long countByRequestedByAndStatus(User tester, String status);
}
