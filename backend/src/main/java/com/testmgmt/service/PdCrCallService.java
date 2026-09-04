package com.testmgmt.service;

import com.testmgmt.dto.PdCrCallDTOs.*;
import com.testmgmt.entity.PdCrCall;
import com.testmgmt.entity.Project;
import com.testmgmt.enums.PdCrCallStatus;
import com.testmgmt.enums.PdCrCallType;
import com.testmgmt.exception.ResourceNotFoundException;
import com.testmgmt.repository.PdCrCallRepository;
import com.testmgmt.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Business logic for the PD/CR Call tracking module, including the
 * dashboard aggregation (counts + ageing buckets).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PdCrCallService {

    private final PdCrCallRepository repo;
    private final ProjectRepository projectRepository;

    // ── CRUD ─────────────────────────────────────────────────────────────────

    @Transactional
    public PdCrCallResponse create(UpsertRequest req) {
        PdCrCall call = new PdCrCall();
        apply(call, req);
        return toResponse(repo.save(call));
    }

    @Transactional
    public PdCrCallResponse update(UUID id, UpsertRequest req) {
        PdCrCall call = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PdCrCall", id));
        apply(call, req);
        return toResponse(repo.save(call));
    }

    public PdCrCallResponse getById(UUID id) {
        return toResponse(repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PdCrCall", id)));
    }

    @Transactional
    public void delete(UUID id) {
        PdCrCall call = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PdCrCall", id));
        call.setActive(false);
        repo.save(call);
    }

    public Page<PdCrCallResponse> list(UUID projectId, PdCrCallType callType,
                                       PdCrCallStatus status, String owner, String q,
                                       int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        String normalizedOwner = (owner == null || owner.isBlank()) ? null : owner;
        String normalizedQ     = (q == null || q.isBlank()) ? null : q;
        return repo.search(projectId, callType, status, normalizedOwner, normalizedQ, pageable)
                .map(this::toResponse);
    }

    // ── Dashboard ────────────────────────────────────────────────────────────

    public DashboardResponse dashboard(UUID projectId) {
        List<PdCrCall> calls = (projectId != null)
                ? repo.findByProjectIdAndActiveTrue(projectId)
                : repo.findByActiveTrue();

        long total  = calls.size();
        long closed = calls.stream()
                .filter(c -> c.getStatus() == PdCrCallStatus.SIGNED_OFF
                          || c.getStatus() == PdCrCallStatus.CLOSED)
                .count();
        long open = total - closed;

        Map<String, Long> byCallType = calls.stream().collect(Collectors.groupingBy(
                c -> c.getCallType() == null ? "OTHER" : c.getCallType().name(),
                LinkedHashMap::new, Collectors.counting()));

        Map<String, Long> byStatus = calls.stream().collect(Collectors.groupingBy(
                c -> c.getStatus() == null ? "OPEN" : c.getStatus().name(),
                LinkedHashMap::new, Collectors.counting()));

        Map<String, Long> byPriority = calls.stream().collect(Collectors.groupingBy(
                c -> c.getPriority() == null ? "UNSET" : c.getPriority().name(),
                LinkedHashMap::new, Collectors.counting()));

        Map<String, Long> byOwner = calls.stream().collect(Collectors.groupingBy(
                c -> (c.getApplicationOwner() == null || c.getApplicationOwner().isBlank())
                        ? "Unassigned" : c.getApplicationOwner(),
                LinkedHashMap::new, Collectors.counting()));

        Map<String, Long> byBucket = calls.stream().collect(Collectors.groupingBy(
                c -> ageingBucket(callAgeingDays(c)),
                LinkedHashMap::new, Collectors.counting()));

        // Top 10 oldest still-open calls
        List<AgeingRow> topAgeing = calls.stream()
                .filter(c -> c.getStatus() != PdCrCallStatus.SIGNED_OFF
                          && c.getStatus() != PdCrCallStatus.CLOSED)
                .sorted(Comparator.comparingLong((PdCrCall c) -> callAgeingDays(c)).reversed())
                .limit(10)
                .map(c -> AgeingRow.builder()
                        .childCallId(c.getChildCallId())
                        .applicationOwner(c.getApplicationOwner())
                        .status(c.getStatus() == null ? null : c.getStatus().name())
                        .ageingDays(callAgeingDays(c))
                        .ageingBucket(ageingBucket(callAgeingDays(c)))
                        .build())
                .toList();

        return DashboardResponse.builder()
                .total(total).open(open).closed(closed)
                .byCallType(byCallType)
                .byStatus(byStatus)
                .byPriority(byPriority)
                .byApplicationOwner(byOwner)
                .byAgeingBucket(byBucket)
                .topAgeing(topAgeing)
                .build();
    }

    // ── Mapping / helpers ──────────────────────────────────────────────────────

    private void apply(PdCrCall c, UpsertRequest r) {
        c.setChildCallId(r.getChildCallId());
        c.setParentCallId(r.getParentCallId());
        c.setCategory(r.getCategory());
        // callType: explicit override wins, else derive from category
        c.setCallType(r.getCallType() != null
                ? r.getCallType()
                : PdCrCallType.fromCategory(r.getCategory()));
        c.setTestingEnvironment(r.getTestingEnvironment());
        c.setInScope(r.getInScope());
        c.setAutomationScope(r.getAutomationScope());
        c.setIssueDescription(r.getIssueDescription());
        c.setPriority(r.getPriority());

        c.setUatSpoc(r.getUatSpoc());
        c.setResponsibleSpoc(r.getResponsibleSpoc());
        c.setResponsibleTeam(r.getResponsibleTeam());
        c.setApplicationOwner(r.getApplicationOwner());
        c.setDateAssignedToOwner(r.getDateAssignedToOwner());

        c.setUatReleaseDate(r.getUatReleaseDate());
        c.setUatCompletionTentative(r.getUatCompletionTentative());
        c.setUatCompletionActual(r.getUatCompletionActual());
        c.setUatSignoffTentative(r.getUatSignoffTentative());
        c.setUatSignoffActual(r.getUatSignoffActual());

        c.setCurrentJiraStatus(r.getCurrentJiraStatus());
        c.setStatus(r.getStatus() != null ? r.getStatus() : deriveStatus(r));
        c.setLatestUpdate(r.getLatestUpdate());
        c.setOpenDefects(r.getOpenDefects());

        if (r.getProjectId() != null) {
            Project p = projectRepository.findById(r.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project", r.getProjectId()));
            c.setProject(p);
            c.setTenantId(p.getTenantId());
        }
    }

    /** If no explicit status supplied, infer a sensible one. */
    private PdCrCallStatus deriveStatus(UpsertRequest r) {
        if (r.getUatSignoffActual() != null) return PdCrCallStatus.SIGNED_OFF;
        if (r.getUatReleaseDate() != null)   return PdCrCallStatus.UAT;
        return PdCrCallStatus.OPEN;
    }

    /**
     * Calls ageing = days from UAT release date (fallback: created date)
     * up to UAT sign-off actual (fallback: today).
     */
    private long callAgeingDays(PdCrCall c) {
        LocalDate start = c.getUatReleaseDate();
        if (start == null && c.getCreatedAt() != null) {
            start = c.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
        }
        if (start == null) return 0;
        LocalDate end = c.getUatSignoffActual() != null ? c.getUatSignoffActual() : LocalDate.now();
        long days = ChronoUnit.DAYS.between(start, end);
        return Math.max(0, days);
    }

    private long ownerAgeingDays(PdCrCall c) {
        if (c.getDateAssignedToOwner() == null) return 0;
        LocalDate end = c.getUatSignoffActual() != null ? c.getUatSignoffActual() : LocalDate.now();
        return Math.max(0, ChronoUnit.DAYS.between(c.getDateAssignedToOwner(), end));
    }

    /** Ageing buckets modelled on the "Ageing Bucket" column of the sheet. */
    private String ageingBucket(long days) {
        if (days <= 10)  return "0-10 Days";
        if (days <= 21)  return "11-21 Days";
        if (days <= 50)  return "22-50 Days";
        if (days <= 150) return "51-150 Days";
        return "Over 151 Days";
    }

    private PdCrCallResponse toResponse(PdCrCall c) {
        long callAge  = callAgeingDays(c);
        long ownerAge = ownerAgeingDays(c);
        return PdCrCallResponse.builder()
                .id(c.getId())
                .childCallId(c.getChildCallId())
                .parentCallId(c.getParentCallId())
                .category(c.getCategory())
                .callType(c.getCallType())
                .testingEnvironment(c.getTestingEnvironment())
                .inScope(c.getInScope())
                .automationScope(c.getAutomationScope())
                .issueDescription(c.getIssueDescription())
                .priority(c.getPriority())
                .uatSpoc(c.getUatSpoc())
                .responsibleSpoc(c.getResponsibleSpoc())
                .responsibleTeam(c.getResponsibleTeam())
                .applicationOwner(c.getApplicationOwner())
                .dateAssignedToOwner(c.getDateAssignedToOwner())
                .uatReleaseDate(c.getUatReleaseDate())
                .uatCompletionTentative(c.getUatCompletionTentative())
                .uatCompletionActual(c.getUatCompletionActual())
                .uatSignoffTentative(c.getUatSignoffTentative())
                .uatSignoffActual(c.getUatSignoffActual())
                .currentJiraStatus(c.getCurrentJiraStatus())
                .status(c.getStatus())
                .latestUpdate(c.getLatestUpdate())
                .openDefects(c.getOpenDefects())
                .projectId(c.getProject() != null ? c.getProject().getId() : null)
                .projectName(c.getProject() != null ? c.getProject().getName() : null)
                .callsAgeingDays(callAge)
                .callsAgeingBucket(ageingBucket(callAge))
                .ageingWithCurrentOwnerDays(ownerAge)
                .ownerAgeingBucket(ageingBucket(ownerAge))
                .signedOff(c.getUatSignoffActual() != null)
                .build();
    }
}
