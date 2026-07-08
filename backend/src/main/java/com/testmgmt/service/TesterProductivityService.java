package com.testmgmt.service;

import com.testmgmt.dto.response.TesterProductivityDTOs.*;
import com.testmgmt.entity.TestCase;
import com.testmgmt.entity.TestExecution;
import com.testmgmt.entity.User;
import com.testmgmt.enums.ExecResult;
import com.testmgmt.enums.TestStatus;
import com.testmgmt.enums.UserRole;
import com.testmgmt.exception.ResourceNotFoundException;
import com.testmgmt.repository.ProjectRepository;
import com.testmgmt.repository.TestCaseRepository;
import com.testmgmt.repository.TestExecutionRepository;
import com.testmgmt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class TesterProductivityService {

    private final UserRepository          userRepository;
    private final TestCaseRepository      testCaseRepository;
    private final TestExecutionRepository executionRepository;
    private final ProjectRepository       projectRepository;

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(ZoneId.systemDefault());

    // ── Team productivity summary ─────────────────────────────────────────────

    @Cacheable(value = "teamProductivity", key = "#projectId != null ? #projectId : 'all'")
    @Transactional(readOnly = true)
    public TeamProductivitySummaryResponse getTeamProductivity(UUID projectId) {

        List<User> testers = userRepository.findByRoleAndActiveTrue(UserRole.TESTER);

        List<TesterProductivityResponse> testerStats = testers.stream().map(user -> {
            List<TestCase> cases = projectId != null
                    ? testCaseRepository.findByAssignedToAndProject(user,
                            projectRepository.findById(projectId)
                                    .orElseThrow(() -> new ResourceNotFoundException("Project", projectId)))
                    : testCaseRepository.findByAssignedTo(user);
            return buildProductivity(user, cases);
        }).toList();

        long totalAssigned = testerStats.stream().mapToLong(TesterProductivityResponse::getTotalAssigned).sum();
        long totalPassed   = testerStats.stream().mapToLong(TesterProductivityResponse::getPassed).sum();
        long totalFailed   = testerStats.stream().mapToLong(TesterProductivityResponse::getFailed).sum();
        long totalDefects  = testerStats.stream().mapToLong(TesterProductivityResponse::getDefectRaised).sum();
        long executed      = totalPassed + totalFailed + totalDefects;
        double overallPassRate = executed > 0 ? round((double) totalPassed / executed * 100) : 0.0;

        return TeamProductivitySummaryResponse.builder()
                .totalTesters(testerStats.size())
                .totalAssigned(totalAssigned)
                .totalPassed(totalPassed)
                .totalFailed(totalFailed)
                .totalDefects(totalDefects)
                .overallPassRate(overallPassRate)
                .testers(testerStats)
                .build();
    }

    // ── Individual tester productivity ────────────────────────────────────────

    @Transactional(readOnly = true)
    public TesterProductivityResponse getTesterProductivity(UUID userId, UUID projectId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        List<TestCase> cases = projectId != null
                ? testCaseRepository.findByAssignedToAndProject(user,
                        projectRepository.findById(projectId)
                                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId)))
                : testCaseRepository.findByAssignedTo(user);

        return buildProductivity(user, cases);
    }

    // ── NEW: Daily team tracking for a specific date ──────────────────────────
    //   Returns per-tester execution counts for the given calendar day,
    //   including defect IDs raised that day. (Feature 3 & 5)

    @Transactional(readOnly = true)
    public DailyTeamTrackingResponse getDailyTeamTracking(LocalDate date) {

        ZoneId zone = ZoneId.systemDefault();
        Instant from = date.atStartOfDay(zone).toInstant();
        Instant to   = date.plusDays(1).atStartOfDay(zone).toInstant();

        List<TestExecution> executions = executionRepository.findAllByDateRange(from, to);

        // Group by tester
        Map<UUID, List<TestExecution>> byTester = executions.stream()
                .collect(Collectors.groupingBy(e -> e.getExecutedBy().getId()));

        List<TesterDailyRecord> records = byTester.entrySet().stream().map(entry -> {
            List<TestExecution> execs = entry.getValue();
            User tester = execs.get(0).getExecutedBy();

            // ── OPTIMISATION: EnumMap frequency table instead of 4 filter().count() ──
            EnumMap<ExecResult, Long> rf = new EnumMap<>(ExecResult.class);
            for (TestExecution e : execs) if (e.getResult() != null) rf.merge(e.getResult(), 1L, Long::sum);

            long passed      = rf.getOrDefault(ExecResult.PASSED, 0L);
            long failed      = rf.getOrDefault(ExecResult.FAILED, 0L);
            long blocked     = rf.getOrDefault(ExecResult.BLOCKED, 0L);
            long defectRaised= rf.getOrDefault(ExecResult.DEFECT_RAISED, 0L);
            long total       = execs.size();
            long executed    = passed + failed + defectRaised + blocked;
            double passRate  = executed > 0 ? round((double) passed / executed * 100) : 0.0;

            // Collect non-null defect refs from DEFECT_RAISED executions
            List<String> defectIds = execs.stream()
                    .filter(e -> e.getResult() == ExecResult.DEFECT_RAISED
                              && e.getDefectRef() != null
                              && !e.getDefectRef().isBlank())
                    .map(TestExecution::getDefectRef)
                    .distinct()
                    .sorted()
                    .toList();

            return TesterDailyRecord.builder()
                    .userId(tester.getId())
                    .fullName(tester.getFullName() != null ? tester.getFullName() : tester.getUsername())
                    .username(tester.getUsername())
                    .email(tester.getEmail())
                    .team(tester.getTeam())
                    .total(total)
                    .passed(passed)
                    .failed(failed)
                    .blocked(blocked)
                    .defectRaised(defectRaised)
                    .passRate(passRate)
                    .defectIds(defectIds)
                    .build();
        })
        .sorted(Comparator.comparingLong(TesterDailyRecord::getTotal).reversed())
        .toList();

        long teamTotal   = records.stream().mapToLong(TesterDailyRecord::getTotal).sum();
        long teamPassed  = records.stream().mapToLong(TesterDailyRecord::getPassed).sum();
        long teamFailed  = records.stream().mapToLong(TesterDailyRecord::getFailed).sum();
        long teamDefects = records.stream().mapToLong(TesterDailyRecord::getDefectRaised).sum();

        return DailyTeamTrackingResponse.builder()
                .date(DATE_FMT.format(from))
                .teamTotal(teamTotal)
                .teamPassed(teamPassed)
                .teamFailed(teamFailed)
                .teamDefects(teamDefects)
                .testerRecords(records)
                .build();
    }

    // ── NEW: Day-by-day history for one tester ────────────────────────────────
    //   Returns one entry per calendar day the tester executed something.
    //   Used for Feature 5 (individual productivity trend).

    @Transactional(readOnly = true)
    public List<DailyProductivityEntry> getTesterDailyHistory(UUID userId, int days) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Instant from = Instant.now().minusSeconds(86400L * days);
        Instant to   = Instant.now();

        List<TestExecution> executions =
                executionRepository.findByTesterAndDateRange(user, from, to);

        // Group by calendar date
        Map<String, List<TestExecution>> byDay = executions.stream()
                .collect(Collectors.groupingBy(e -> DATE_FMT.format(e.getExecutedAt())));

        return byDay.entrySet().stream()
                .sorted(Map.Entry.<String, List<TestExecution>>comparingByKey().reversed())
                .map(entry -> {
                    List<TestExecution> execs = entry.getValue();
                    // ── Single-pass EnumMap instead of 4 stream filter().count() ──
                    EnumMap<ExecResult, Long> rf = new EnumMap<>(ExecResult.class);
                    for (TestExecution e : execs) if (e.getResult() != null) rf.merge(e.getResult(), 1L, Long::sum);
                    long passed       = rf.getOrDefault(ExecResult.PASSED, 0L);
                    long failed       = rf.getOrDefault(ExecResult.FAILED, 0L);
                    long blocked      = rf.getOrDefault(ExecResult.BLOCKED, 0L);
                    long defectRaised = rf.getOrDefault(ExecResult.DEFECT_RAISED, 0L);
                    long total        = execs.size();
                    long executed     = passed + failed + defectRaised + blocked;
                    double passRate   = executed > 0 ? round((double) passed / executed * 100) : 0.0;

                    return DailyProductivityEntry.builder()
                            .date(entry.getKey())
                            .total(total)
                            .passed(passed)
                            .failed(failed)
                            .blocked(blocked)
                            .defectRaised(defectRaised)
                            .passRate(passRate)
                            .build();
                })
                .toList();
    }


    // ── NEW: resolve current user by email (for /me endpoint) ────────────────

    @Transactional(readOnly = true)
    public TesterProductivityResponse getMyProductivity(String email, UUID projectId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
        return getTesterProductivity(user.getId(), projectId);
    }

    // ── Build full productivity breakdown for one user ────────────────────────
    // DSA OPTIMISATION: Previously called count() (stream filter) once per status
    // = O(N × S) where N = cases, S = number of statuses checked.
    // Now: single O(N) pass builds an EnumMap<TestStatus,Long> frequency table,
    // then all status look-ups are O(1) via map.getOrDefault().

    private TesterProductivityResponse buildProductivity(User user, List<TestCase> cases) {

        // ── Single O(N) pass: build frequency map ────────────────────────────
        EnumMap<TestStatus, Long> freq = new EnumMap<>(TestStatus.class);
        for (TestCase tc : cases) {
            freq.merge(tc.getStatus(), 1L, Long::sum);
        }

        long passed      = freq.getOrDefault(TestStatus.PASSED, 0L)
                         + freq.getOrDefault(TestStatus.SIGNED_OFF, 0L);
        long failed      = freq.getOrDefault(TestStatus.FAILED, 0L);
        long defects     = freq.getOrDefault(TestStatus.DEFECT_RAISED, 0L);
        long inProgress  = freq.getOrDefault(TestStatus.IN_PROGRESS, 0L);
        long underReview = freq.getOrDefault(TestStatus.UNDER_REVIEW, 0L);
        long pending     = freq.getOrDefault(TestStatus.ASSIGNED, 0L)
                         + freq.getOrDefault(TestStatus.DRAFT, 0L);
        long executed    = passed + failed + defects;
        long total       = cases.size();

        double passRate   = executed > 0 ? round((double) passed  / executed * 100) : 0.0;
        double execRate   = total    > 0 ? round((double) executed / total   * 100) : 0.0;
        double defectRate = executed > 0 ? round((double) defects  / executed * 100) : 0.0;

        // ── Module breakdown: single groupingBy pass → per-module EnumMap ────
        // Was: nested stream filter per status per module = O(N × S × M)
        // Now: one groupingBy + one EnumMap pass = O(N) total
        List<ModuleProductivity> moduleBreakdown = cases.stream()
                .filter(tc -> tc.getModule() != null)
                .collect(Collectors.groupingBy(tc -> tc.getModule().getName()))
                .entrySet().stream()
                .map(e -> {
                    EnumMap<TestStatus, Long> mf = new EnumMap<>(TestStatus.class);
                    for (TestCase tc : e.getValue()) mf.merge(tc.getStatus(), 1L, Long::sum);
                    long mp = mf.getOrDefault(TestStatus.PASSED, 0L)
                            + mf.getOrDefault(TestStatus.SIGNED_OFF, 0L);
                    long mfail = mf.getOrDefault(TestStatus.FAILED, 0L);
                    long md    = mf.getOrDefault(TestStatus.DEFECT_RAISED, 0L);
                    long me    = mp + mfail + md;
                    return ModuleProductivity.builder()
                            .moduleName(e.getKey())
                            .assigned((long) e.getValue().size())
                            .passed(mp).failed(mfail).defectRaised(md)
                            .passRate(me > 0 ? round((double) mp / me * 100) : 0.0)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getAssigned(), a.getAssigned()))
                .toList();

        // ── Project breakdown: same pattern ──────────────────────────────────
        List<ProjectProductivity> projectBreakdown = cases.stream()
                .filter(tc -> tc.getProject() != null)
                .collect(Collectors.groupingBy(tc -> tc.getProject().getId()))
                .entrySet().stream()
                .map(e -> {
                    var first = e.getValue().get(0);
                    long pp = 0L, pf = 0L;
                    for (TestCase tc : e.getValue()) {
                        TestStatus s = tc.getStatus();
                        if (s == TestStatus.PASSED || s == TestStatus.SIGNED_OFF) pp++;
                        else if (s == TestStatus.FAILED) pf++;
                    }
                    long pe = pp + pf;
                    return ProjectProductivity.builder()
                            .projectId(e.getKey())
                            .projectName(first.getProject().getName())
                            .assigned((long) e.getValue().size())
                            .passed(pp).failed(pf)
                            .passRate(pe > 0 ? round((double) pp / pe * 100) : 0.0)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getAssigned(), a.getAssigned()))
                .toList();

        List<DailyProductivityEntry> dailyHistory = getTesterDailyHistory(user.getId(), 30);

        return TesterProductivityResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .team(user.getTeam())
                .totalAssigned(total)
                .totalExecuted(executed)
                .passed(passed).failed(failed).defectRaised(defects)
                .inProgress(inProgress).underReview(underReview).pending(pending)
                .passRate(passRate).executionRate(execRate).defectRate(defectRate)
                .moduleBreakdown(moduleBreakdown)
                .projectBreakdown(projectBreakdown)
                .dailyHistory(dailyHistory)
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private double round(double v) { return Math.round(v * 100.0) / 100.0; }
}
