package com.testmgmt.service;

import com.testmgmt.dto.request.WorkflowDTOs.ActionReleaseRequest;
import com.testmgmt.dto.request.WorkflowDTOs.ReleaseTestCaseRequest;
import com.testmgmt.dto.response.ResponseDTOs.TestCaseReleaseResponse;
import com.testmgmt.dto.response.ResponseDTOs.TestCaseResponse;
import com.testmgmt.entity.*;
import com.testmgmt.enums.*;
import com.testmgmt.exception.BadRequestException;
import com.testmgmt.exception.ResourceNotFoundException;
import com.testmgmt.exception.WorkflowException;
import com.testmgmt.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Release Test Case feature — FR1 through FR9 of the AI Module Enhancement spec.
 *
 * Flow:
 *   Tester calls requestRelease()  → status → RELEASE_REQUESTED, release record PENDING
 *   Manager calls actionRelease()  → APPROVED: status → RELEASED, assignment removed, audit logged
 *                                 → REJECTED:  status → ASSIGNED (restored), release record REJECTED
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ReleaseService {

    private final TestCaseRepository        testCaseRepository;
    private final TestCaseReleaseRepository releaseRepository;
    private final TestCaseAssignmentRepository assignmentRepository;
    private final UserRepository            userRepository;
    private final AuditLogRepository        auditLogRepository;
    private final NotificationService       notificationService;

    // ── FR1-FR4: Tester requests release ─────────────────────────────────────

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "dashboard",        allEntries = true),
        @CacheEvict(value = "allDashboards",    allEntries = true),
        @CacheEvict(value = "workload",         allEntries = true),
        @CacheEvict(value = "teamProductivity", allEntries = true),
    })
    public TestCaseReleaseResponse requestRelease(UUID testCaseId,
                                                   ReleaseTestCaseRequest req,
                                                   String testerEmail) {
        TestCase tc = testCaseRepository.findById(testCaseId)
                .orElseThrow(() -> new ResourceNotFoundException("TestCase", testCaseId));

        User tester = userRepository.findByEmail(testerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", testerEmail));

        // Validation: only ASSIGNED or IN_PROGRESS cases can be released
        if (!List.of(TestStatus.ASSIGNED, TestStatus.IN_PROGRESS).contains(tc.getStatus())) {
            throw new WorkflowException(
                "Only ASSIGNED or IN_PROGRESS test cases can be released. Current status: " + tc.getStatus());
        }

        // Validation: tester must be the assigned tester
        boolean isAssigned = assignmentRepository.findByTestCase(tc).stream()
                .anyMatch(a -> a.getAssignedTo().getEmail().equals(testerEmail));
        if (!isAssigned) {
            throw new WorkflowException("You are not assigned to this test case.");
        }

        // Validation: no pending release request already exists
        releaseRepository.findByTestCaseAndStatus(tc, "PENDING").ifPresent(existing -> {
            throw new BadRequestException("A release request is already pending for this test case.");
        });

        // Validation: OTHER reason requires detail
        if (req.getReason() == ReleaseReason.OTHER &&
                (req.getReasonDetail() == null || req.getReasonDetail().isBlank())) {
            throw new BadRequestException("Reason detail is required when reason is OTHER.");
        }

        // Update status → RELEASE_REQUESTED
        TestStatus previousStatus = tc.getStatus();
        tc.setStatus(TestStatus.RELEASE_REQUESTED);
        testCaseRepository.save(tc);

        // Persist release record
        TestCaseRelease release = TestCaseRelease.builder()
                .testCase(tc)
                .requestedBy(tester)
                .reason(req.getReason())
                .reasonDetail(req.getReasonDetail())
                .status("PENDING")
                .build();
        release = releaseRepository.save(release);

        // FR6: Audit trail
        audit(tc.getId(), tester.getEmail(),
              "RELEASE_REQUESTED",
              String.format("{\"from\":\"%s\",\"to\":\"RELEASE_REQUESTED\",\"reason\":\"%s\"}",
                            previousStatus, req.getReason()));

        // FR5: Notify all MANAGER/ADMIN users of the project
        notifyManagers(tc,
                "Release Request: " + tc.getCode(),
                tester.getFullName() + " requested release of [" + tc.getCode() + "] " + tc.getTitle()
                + " — Reason: " + formatReason(req.getReason(), req.getReasonDetail()),
                NotificationType.RELEASE_REQUESTED);

        return toResponse(release);
    }

    // ── FR7: Manager actions the release request ──────────────────────────────

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "dashboard",        allEntries = true),
        @CacheEvict(value = "allDashboards",    allEntries = true),
        @CacheEvict(value = "workload",         allEntries = true),
        @CacheEvict(value = "teamProductivity", allEntries = true),
    })
    public TestCaseReleaseResponse actionRelease(UUID releaseId,
                                                  ActionReleaseRequest req,
                                                  String managerEmail) {
        TestCaseRelease release = releaseRepository.findById(releaseId)
                .orElseThrow(() -> new ResourceNotFoundException("TestCaseRelease", releaseId));

        if (!"PENDING".equals(release.getStatus())) {
            throw new BadRequestException("Release request is already " + release.getStatus() + ".");
        }

        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", managerEmail));

        boolean approved = "APPROVED".equalsIgnoreCase(req.getAction());
        TestCase tc = release.getTestCase();

        release.setActionedBy(manager);
        release.setActionedAt(Instant.now());
        release.setManagerNote(req.getManagerNote());

        if (approved) {
            // FR7: Remove the assignment
            List<TestCaseAssignment> assignments = assignmentRepository.findByTestCase(tc);
            assignmentRepository.deleteAll(assignments);

            // FR4: Update status → RELEASED (ready for reassignment)
            tc.setStatus(TestStatus.RELEASED);
            testCaseRepository.save(tc);
            release.setStatus("APPROVED");

            // FR6: Audit trail
            audit(tc.getId(), manager.getEmail(),
                  "RELEASE_APPROVED",
                  String.format("{\"from\":\"RELEASE_REQUESTED\",\"to\":\"RELEASED\",\"manager\":\"%s\"}", managerEmail));

            // FR5: Notify the tester
            notificationService.create(release.getRequestedBy(),
                    NotificationType.CASE_RELEASED,
                    "Test Case Released: " + tc.getCode(),
                    "Your release request for [" + tc.getCode() + "] has been approved. "
                    + (req.getManagerNote() != null ? "Note: " + req.getManagerNote() : ""),
                    "TEST_CASE", tc.getId());

            // FR7: Optional immediate reassignment
            if (req.getReassignToUserId() != null) {
                User newTester = userRepository.findById(req.getReassignToUserId())
                        .orElseThrow(() -> new ResourceNotFoundException("User", req.getReassignToUserId()));
                TestCaseAssignment newAssignment = TestCaseAssignment.builder()
                        .testCase(tc)
                        .assignedTo(newTester)
                        .assignedBy(manager)
                        .assignedAt(Instant.now())
                        .reassignedFromId(release.getRequestedBy().getId())
                        .reassignReason("Release approved — reassigned by " + manager.getFullName())
                        .build();
                assignmentRepository.save(newAssignment);
                tc.setStatus(TestStatus.ASSIGNED);
                tc.setAssignedTo(newTester);
                testCaseRepository.save(tc);

                notificationService.create(newTester, NotificationType.REASSIGNED,
                        "Test Case Assigned: " + tc.getCode(),
                        "[" + tc.getCode() + "] " + tc.getTitle() + " has been assigned to you.",
                        "TEST_CASE", tc.getId());
            }

        } else {
            // REJECTED — restore original status
            tc.setStatus(TestStatus.ASSIGNED);
            testCaseRepository.save(tc);
            release.setStatus("REJECTED");

            audit(tc.getId(), manager.getEmail(),
                  "RELEASE_REJECTED",
                  String.format("{\"status\":\"ASSIGNED_RESTORED\",\"manager\":\"%s\",\"note\":\"%s\"}",
                                managerEmail, req.getManagerNote()));

            notificationService.create(release.getRequestedBy(),
                    NotificationType.CASE_RELEASED,
                    "Release Request Rejected: " + tc.getCode(),
                    "Your release request for [" + tc.getCode() + "] was rejected. "
                    + (req.getManagerNote() != null ? "Manager note: " + req.getManagerNote() : ""),
                    "TEST_CASE", tc.getId());
        }

        return toResponse(releaseRepository.save(release));
    }

    // ── Query: all PENDING releases (manager inbox) ───────────────────────────

    @Transactional(readOnly = true)
    public List<TestCaseReleaseResponse> getPendingReleases() {
        return releaseRepository.findByStatusOrderByRequestedAtAsc("PENDING")
                .stream().map(this::toResponse).toList();
    }

    // ── Query: release history for a test case ────────────────────────────────

    @Transactional(readOnly = true)
    public List<TestCaseReleaseResponse> getReleaseHistory(UUID testCaseId) {
        TestCase tc = testCaseRepository.findById(testCaseId)
                .orElseThrow(() -> new ResourceNotFoundException("TestCase", testCaseId));
        return releaseRepository.findByTestCaseOrderByRequestedAtDesc(tc)
                .stream().map(this::toResponse).toList();
    }

    // ── Query: my release requests (tester view) ──────────────────────────────

    @Transactional(readOnly = true)
    public List<TestCaseReleaseResponse> getMyReleases(String testerEmail) {
        User tester = userRepository.findByEmail(testerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", testerEmail));
        return releaseRepository.findByRequestedByOrderByRequestedAtDesc(tester)
                .stream().map(this::toResponse).toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void audit(UUID entityId, String performedBy, String action, String diff) {
        auditLogRepository.save(AuditLog.builder()
                .entityType("TEST_CASE")
                .entityId(entityId)
                .action(action)
                .performedBy(performedBy)
                .diff(diff)
                .performedAt(Instant.now())
                .build());
    }

    private void notifyManagers(TestCase tc, String title, String message, NotificationType type) {
        userRepository.findByRoleAndActiveTrue(UserRole.MANAGER)
                .forEach(mgr -> notificationService.create(mgr, type, title, message,
                                                           "TEST_CASE", tc.getId()));
        userRepository.findByRoleAndActiveTrue(UserRole.ADMIN)
                .forEach(adm -> notificationService.create(adm, type, title, message,
                                                           "TEST_CASE", tc.getId()));
    }

    private String formatReason(ReleaseReason reason, String detail) {
        String base = reason.name().replace('_', ' ');
        return (detail != null && !detail.isBlank()) ? base + " — " + detail : base;
    }

    private TestCaseReleaseResponse toResponse(TestCaseRelease r) {
        TestCase tc = r.getTestCase();
        return TestCaseReleaseResponse.builder()
                .id(r.getId())
                .testCaseId(tc.getId())
                .testCaseCode(tc.getCode())
                .testCaseTitle(tc.getTitle())
                .requestedBy(r.getRequestedBy().getEmail())
                .reason(r.getReason().name())
                .reasonDetail(r.getReasonDetail())
                .status(r.getStatus())
                .actionedBy(r.getActionedBy() != null ? r.getActionedBy().getEmail() : null)
                .managerNote(r.getManagerNote())
                .requestedAt(r.getRequestedAt())
                .actionedAt(r.getActionedAt())
                .build();
    }
}
