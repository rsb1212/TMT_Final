package com.testmgmt.service;

import com.testmgmt.dto.request.CallDTOs.*;
import com.testmgmt.dto.response.ResponseDTOs.*;
import com.testmgmt.entity.Module;
import com.testmgmt.entity.*;
import com.testmgmt.enums.CallStatus;
import com.testmgmt.enums.CallType;
import com.testmgmt.enums.NotificationType;
import com.testmgmt.exception.BadRequestException;
import com.testmgmt.exception.ResourceNotFoundException;
import com.testmgmt.exception.WorkflowException;
import com.testmgmt.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@SuppressWarnings({"null"})
public class QACallService {

    private final QACallRepository          callRepository;
    private final CallAttachmentRepository  attachmentRepository;
    private final ProjectRepository         projectRepository;
    private final ModuleRepository          moduleRepository;
    private final UserRepository            userRepository;
    private final TestCaseRepository        testCaseRepository;
    private final DefectRepository          defectRepository;
    private final NotificationService       notificationService;

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public QACallResponse create(CreateCallRequest req, String organiserEmail) {
        User organiser = userRepository.findByEmail(organiserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", organiserEmail));

        Project project = projectRepository.findById(req.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", req.getProjectId()));

        Module module = req.getModuleId() != null
                ? moduleRepository.findById(req.getModuleId()).orElse(null)
                : null;

        if (req.getScheduledAt() == null)
            throw new BadRequestException("scheduledAt is required");

        String code = String.format("CALL-%04d", callRepository.findMaxCodeSequence() + 1);

        QACall call = QACall.builder()
                .code(code)
                .title(req.getTitle())
                .agenda(req.getAgenda())
                .callType(req.getCallType())
                .status(CallStatus.SCHEDULED)
                .scheduledAt(req.getScheduledAt())
                .meetingUrl(req.getMeetingUrl())
                .platform(req.getPlatform())
                .project(project)
                .module(module)
                .organiser(organiser)
                .durationMinutes(req.getDurationMinutes())
                .isRecurring(req.getIsRecurring() != null && req.getIsRecurring())
                .recurrencePattern(req.getRecurrencePattern())
                .build();

        // Participants
        if (req.getParticipantIds() != null && !req.getParticipantIds().isEmpty()) {
            List<User> participants = userRepository.findAllById(req.getParticipantIds());
            call.setParticipants(participants);
        }

        // Linked test cases
        if (req.getTestCaseIds() != null && !req.getTestCaseIds().isEmpty()) {
            List<TestCase> tcs = testCaseRepository.findAllById(req.getTestCaseIds());
            call.setTestCases(tcs);
        }

        // Linked defects
        if (req.getDefectIds() != null && !req.getDefectIds().isEmpty()) {
            List<Defect> defects = defectRepository.findAllById(req.getDefectIds());
            call.setDefects(defects);
        }

        QACall saved = callRepository.save(call);

        // Notify all participants
        if (!call.getParticipants().isEmpty()) {
            call.getParticipants().forEach(p -> {
                if (!p.getId().equals(organiser.getId())) {
                    notificationService.create(p, NotificationType.CALL_SCHEDULED,
                            "Call Scheduled: " + call.getTitle(),
                            "You have been invited to " + call.getCallType().name().replace('_', ' ') +
                            " on " + call.getScheduledAt(),
                            "QA_CALL", saved.getId());
                }
            });
        }

        return toResponse(saved);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<QACallResponse> list(UUID projectId, String status, String callType,
                                      int page, int size) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        Pageable pageable = PageRequest.of(page, size, Sort.by("scheduledAt").descending());

        if (status != null && !status.isBlank()) {
            return callRepository.findByProjectAndStatus(
                    project, CallStatus.valueOf(status), pageable).map(this::toResponse);
        }
        if (callType != null && !callType.isBlank()) {
            return callRepository.findByProjectAndCallType(
                    project, CallType.valueOf(callType), pageable).map(this::toResponse);
        }
        return callRepository.findByProject(project, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public QACallResponse getById(UUID id) {
        return toResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public List<QACallResponse> getUpcoming(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        return callRepository.findUpcoming(project, Instant.now())
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<QACallResponse> getMyCallsForProject(UUID projectId, String userEmail) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", userEmail));
        return callRepository.findByProjectAndInvolvedUser(project, user)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CallSummaryResponse getSummary(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        List<QACall> all = callRepository.findByProject(project);

        long totalMinutes = all.stream()
                .filter(c -> c.getDurationMinutes() != null)
                .mapToLong(QACall::getDurationMinutes).sum();

        List<QACallResponse> upcoming = callRepository
                .findUpcoming(project, Instant.now())
                .stream().limit(5).map(this::toResponse).toList();

        List<QACallResponse> recent = callRepository
                .findRecentWithMinutes(project, PageRequest.of(0, 5))
                .stream().map(this::toResponse).toList();

        return CallSummaryResponse.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .totalCalls(all.size())
                .scheduled(count(all, CallStatus.SCHEDULED))
                .completed(count(all, CallStatus.COMPLETED))
                .cancelled(count(all, CallStatus.CANCELLED))
                .inProgress(count(all, CallStatus.IN_PROGRESS))
                .standups(countType(all, CallType.STANDUP))
                .defectTriages(countType(all, CallType.DEFECT_TRIAGE))
                .uatReviews(countType(all, CallType.UAT_REVIEW))
                .testPlannings(countType(all, CallType.TEST_PLANNING))
                .smeReviews(countType(all, CallType.SME_REVIEW))
                .totalMinutesSpent(totalMinutes)
                .upcomingCalls(upcoming)
                .recentCalls(recent)
                .build();
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @Transactional
    public QACallResponse update(UUID id, UpdateCallRequest req) {
        QACall call = findById(id);

        if (call.getStatus() == CallStatus.COMPLETED || call.getStatus() == CallStatus.CANCELLED)
            throw new WorkflowException("Cannot update a " + call.getStatus() + " call");

        if (req.getTitle()           != null) call.setTitle(req.getTitle());
        if (req.getAgenda()          != null) call.setAgenda(req.getAgenda());
        if (req.getCallType()        != null) call.setCallType(req.getCallType());
        if (req.getScheduledAt()     != null) call.setScheduledAt(req.getScheduledAt());
        if (req.getMeetingUrl()      != null) call.setMeetingUrl(req.getMeetingUrl());
        if (req.getPlatform()        != null) call.setPlatform(req.getPlatform());
        if (req.getDurationMinutes() != null) call.setDurationMinutes(req.getDurationMinutes());

        if (req.getParticipantIds() != null)
            call.setParticipants(userRepository.findAllById(req.getParticipantIds()));
        if (req.getTestCaseIds() != null)
            call.setTestCases(testCaseRepository.findAllById(req.getTestCaseIds()));
        if (req.getDefectIds() != null)
            call.setDefects(defectRepository.findAllById(req.getDefectIds()));

        return toResponse(callRepository.save(call));
    }

    @Transactional
    public QACallResponse updateStatus(UUID id, UpdateCallStatusRequest req) {
        QACall call = findById(id);
        call.setStatus(req.getStatus());
        if (req.getStatus() == CallStatus.IN_PROGRESS && call.getStartedAt() == null)
            call.setStartedAt(Instant.now());
        return toResponse(callRepository.save(call));
    }

    @Transactional
    public QACallResponse complete(UUID id, CompleteCallRequest req, String recorderEmail) {
        QACall call = findById(id);
        if (call.getStatus() == CallStatus.CANCELLED)
            throw new WorkflowException("Cannot complete a cancelled call");

        call.setStatus(CallStatus.COMPLETED);
        call.setStartedAt(req.getStartedAt() != null ? req.getStartedAt() : call.getStartedAt());
        call.setEndedAt(req.getEndedAt() != null ? req.getEndedAt() : Instant.now());
        if (req.getDurationMinutes() != null) call.setDurationMinutes(req.getDurationMinutes());
        call.setMinutes(req.getMinutes());
        call.setActionItems(req.getActionItems());
        call.setDecisions(req.getDecisions());

        userRepository.findByEmail(recorderEmail).ifPresent(call::setNotesRecordedBy);

        QACall saved = callRepository.save(call);

        // Notify participants that notes are available
        call.getParticipants().forEach(p ->
            notificationService.create(p, NotificationType.CALL_NOTES_READY,
                    "Call Notes Ready: " + call.getTitle(),
                    "MoM for " + call.getTitle() + " is now available.",
                    "QA_CALL", saved.getId())
        );

        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        QACall call = findById(id);
        if (call.getStatus() == CallStatus.COMPLETED)
            throw new WorkflowException("Cannot delete a completed call. Cancel it instead.");
        callRepository.delete(call);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private QACall findById(UUID id) {
        return callRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("QACall", id));
    }

    private long count(List<QACall> calls, CallStatus status) {
        return calls.stream().filter(c -> c.getStatus() == status).count();
    }

    private long countType(List<QACall> calls, CallType type) {
        return calls.stream().filter(c -> c.getCallType() == type).count();
    }

    public QACallResponse toResponse(QACall c) {
        return QACallResponse.builder()
                .id(c.getId())
                .code(c.getCode())
                .title(c.getTitle())
                .agenda(c.getAgenda())
                .callType(c.getCallType() != null ? c.getCallType().name() : null)
                .status(c.getStatus() != null ? c.getStatus().name() : null)
                .scheduledAt(c.getScheduledAt())
                .startedAt(c.getStartedAt())
                .endedAt(c.getEndedAt())
                .durationMinutes(c.getDurationMinutes())
                .meetingUrl(c.getMeetingUrl())
                .platform(c.getPlatform())
                .project(ProjectService.toResponse(c.getProject()))
                .module(c.getModule() != null
                        ? ModuleResponse.builder()
                                .id(c.getModule().getId())
                                .name(c.getModule().getName())
                                .projectId(c.getProject().getId())
                                .build()
                        : null)
                .organiser(AuthService.toUserResponse(c.getOrganiser()))
                .participants(c.getParticipants() == null ? List.of()
                        : c.getParticipants().stream()
                                .map(AuthService::toUserResponse).toList())
                .testCases(c.getTestCases() == null ? List.of()
                        : c.getTestCases().stream()
                                .map(tc -> TestCaseResponse.builder()
                                        .id(tc.getId()).code(tc.getCode())
                                        .title(tc.getTitle()).build())
                                .toList())
                .defectCodes(c.getDefects() == null ? List.of()
                        : c.getDefects().stream().map(d -> d.getCode()).toList())
                .minutes(c.getMinutes())
                .actionItems(c.getActionItems())
                .decisions(c.getDecisions())
                .notesRecordedBy(c.getNotesRecordedBy() != null
                        ? AuthService.toUserResponse(c.getNotesRecordedBy()) : null)
                .isRecurring(c.getIsRecurring())
                .recurrencePattern(c.getRecurrencePattern())
                .attachmentCount(c.getAttachments() != null ? c.getAttachments().size() : 0)
                .createdAt(c.getCreatedAt())
                .build();
    }
}
