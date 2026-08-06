package com.testmgmt.service;

import com.testmgmt.dto.request.CallNumberDTOs.*;
import com.testmgmt.dto.response.ResponseDTOs.*;
import com.testmgmt.entity.CallNumber;
import com.testmgmt.entity.Project;
import com.testmgmt.entity.TestCase;
import com.testmgmt.enums.TestStatus;
import com.testmgmt.exception.BadRequestException;
import com.testmgmt.exception.ResourceNotFoundException;
import com.testmgmt.repository.CallNumberRepository;
import com.testmgmt.repository.ProjectRepository;
import com.testmgmt.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for Call Number Management.
 * Handles CRUD operations for call numbers with hierarchical structure.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class CallNumberService {

    private final CallNumberRepository callNumberRepository;
    private final ProjectRepository projectRepository;
    private final TestCaseRepository testCaseRepository;

    // ══════════════════════════════════════════════════════════════════════════
    // CREATE OPERATIONS
    // ══════════════════════════════════════════════════════════════════════════

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "callNumbers", allEntries = true),
        @CacheEvict(value = "callNumberTree", allEntries = true)
    })
    public CallNumberResponse create(CreateCallNumberRequest req) {
        Project project = projectRepository.findById(req.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", req.getProjectId()));

        // Check for duplicate code in project
        if (callNumberRepository.existsByCodeAndProject(req.getCode(), project)) {
            throw new BadRequestException("Call number code '" + req.getCode() + "' already exists in this project");
        }

        CallNumber parent = null;
        if (req.getParentCallNumberId() != null) {
            parent = callNumberRepository.findById(req.getParentCallNumberId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent Call Number", req.getParentCallNumberId()));
            
            // Ensure parent belongs to same project
            if (!parent.getProject().getId().equals(project.getId())) {
                throw new BadRequestException("Parent call number must belong to the same project");
            }
        }

        CallNumber callNumber = CallNumber.builder()
                .code(req.getCode().toUpperCase().trim())
                .name(req.getName().trim())
                .description(req.getDescription())
                .project(project)
                .parentCallNumber(parent)
                .externalReference(req.getExternalReference())
                .jiraKey(req.getJiraKey())
                .sortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0)
                .active(true)
                .build();

        CallNumber saved = callNumberRepository.save(callNumber);
        log.info("Created call number {} for project {}", saved.getCode(), project.getName());
        
        return toResponse(saved, true);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "callNumbers", allEntries = true),
        @CacheEvict(value = "callNumberTree", allEntries = true)
    })
    public List<CallNumberResponse> bulkCreate(BulkCreateCallNumbersRequest req) {
        Project project = projectRepository.findById(req.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", req.getProjectId()));

        Map<String, CallNumber> codeToCallNumber = new HashMap<>();
        List<CallNumberResponse> results = new ArrayList<>();

        // First pass: Create all parent call numbers (those without parentCode)
        for (BulkCreateCallNumbersRequest.CallNumberItem item : req.getCallNumbers()) {
            if (item.getParentCode() == null || item.getParentCode().isBlank()) {
                if (!callNumberRepository.existsByCodeAndProject(item.getCode(), project)) {
                    CallNumber cn = CallNumber.builder()
                            .code(item.getCode().toUpperCase().trim())
                            .name(item.getName().trim())
                            .description(item.getDescription())
                            .project(project)
                            .externalReference(item.getExternalReference())
                            .jiraKey(item.getJiraKey())
                            .active(true)
                            .build();
                    cn = callNumberRepository.save(cn);
                    codeToCallNumber.put(cn.getCode(), cn);
                    results.add(toResponse(cn, false));
                }
            }
        }

        // Second pass: Create child call numbers
        for (BulkCreateCallNumbersRequest.CallNumberItem item : req.getCallNumbers()) {
            if (item.getParentCode() != null && !item.getParentCode().isBlank()) {
                CallNumber parent = codeToCallNumber.get(item.getParentCode().toUpperCase().trim());
                if (parent == null) {
                    parent = callNumberRepository.findByCodeAndProject(
                            item.getParentCode().toUpperCase().trim(), project).orElse(null);
                }
                
                if (parent != null && !callNumberRepository.existsByCodeAndProject(item.getCode(), project)) {
                    CallNumber cn = CallNumber.builder()
                            .code(item.getCode().toUpperCase().trim())
                            .name(item.getName().trim())
                            .description(item.getDescription())
                            .project(project)
                            .parentCallNumber(parent)
                            .externalReference(item.getExternalReference())
                            .jiraKey(item.getJiraKey())
                            .active(true)
                            .build();
                    cn = callNumberRepository.save(cn);
                    codeToCallNumber.put(cn.getCode(), cn);
                    results.add(toResponse(cn, false));
                }
            }
        }

        log.info("Bulk created {} call numbers for project {}", results.size(), project.getName());
        return results;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // READ OPERATIONS
    // ══════════════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public CallNumberResponse getById(UUID id) {
        CallNumber cn = callNumberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CallNumber", id));
        return toResponse(cn, true);
    }

    @Transactional(readOnly = true)
    public CallNumberResponse getByCode(String code, UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        CallNumber cn = callNumberRepository.findByCodeAndProject(code, project)
                .orElseThrow(() -> new ResourceNotFoundException("CallNumber", code));
        return toResponse(cn, true);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "callNumbers", key = "#projectId")
    public List<CallNumberResponse> getByProject(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        return callNumberRepository.findByProjectAndActiveTrue(project)
                .stream()
                .map(cn -> toResponse(cn, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "callNumberTree", key = "#projectId")
    public CallNumberTreeResponse getTree(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        
        List<CallNumber> parents = callNumberRepository
                .findByProjectAndParentCallNumberIsNullAndActiveTrue(project);
        
        List<CallNumberResponse> tree = parents.stream()
                .map(cn -> toResponseWithChildren(cn))
                .collect(Collectors.toList());
        
        long totalMapped = testCaseRepository.countByProjectAndCallNumberIsNotNull(project);
        
        return CallNumberTreeResponse.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .callNumbers(tree)
                .totalCallNumbers(callNumberRepository.countByProjectAndActiveTrue(project))
                .totalTestCasesMapped(totalMapped)
                .build();
    }

    @Transactional(readOnly = true)
    public List<CallNumberResponse> getParentCallNumbers(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        return callNumberRepository.findByProjectAndParentCallNumberIsNullAndActiveTrue(project)
                .stream()
                .map(cn -> toResponse(cn, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CallNumberResponse> getChildCallNumbers(UUID parentId) {
        CallNumber parent = callNumberRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("CallNumber", parentId));
        return callNumberRepository.findByParentCallNumberAndActiveTrue(parent)
                .stream()
                .map(cn -> toResponse(cn, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CallNumberResponse> search(UUID projectId, String query) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        return callNumberRepository.searchByCodeOrName(project, query)
                .stream()
                .map(cn -> toResponse(cn, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CallNumberResponse> searchGlobal(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("code").ascending());
        return callNumberRepository.searchGlobally(query, pageable)
                .stream()
                .map(cn -> toResponse(cn, false))
                .collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // UPDATE OPERATIONS
    // ══════════════════════════════════════════════════════════════════════════

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "callNumbers", allEntries = true),
        @CacheEvict(value = "callNumberTree", allEntries = true)
    })
    public CallNumberResponse update(UUID id, UpdateCallNumberRequest req) {
        CallNumber cn = callNumberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CallNumber", id));

        if (req.getCode() != null && !req.getCode().equals(cn.getCode())) {
            if (callNumberRepository.existsByCodeAndProject(req.getCode(), cn.getProject())) {
                throw new BadRequestException("Call number code '" + req.getCode() + "' already exists");
            }
            cn.setCode(req.getCode().toUpperCase().trim());
        }

        if (req.getName() != null) cn.setName(req.getName().trim());
        if (req.getDescription() != null) cn.setDescription(req.getDescription());
        if (req.getExternalReference() != null) cn.setExternalReference(req.getExternalReference());
        if (req.getJiraKey() != null) cn.setJiraKey(req.getJiraKey());
        if (req.getSortOrder() != null) cn.setSortOrder(req.getSortOrder());

        // Handle parent change
        if (req.getNewParentCallNumberId() != null) {
            if (req.getNewParentCallNumberId().equals(cn.getId())) {
                throw new BadRequestException("Cannot set call number as its own parent");
            }
            CallNumber newParent = callNumberRepository.findById(req.getNewParentCallNumberId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent Call Number", req.getNewParentCallNumberId()));
            if (!newParent.getProject().getId().equals(cn.getProject().getId())) {
                throw new BadRequestException("Parent call number must belong to the same project");
            }
            cn.setParentCallNumber(newParent);
        }

        CallNumber saved = callNumberRepository.save(cn);
        log.info("Updated call number {}", saved.getCode());
        return toResponse(saved, true);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "callNumbers", allEntries = true),
        @CacheEvict(value = "callNumberTree", allEntries = true)
    })
    public void deactivate(UUID id) {
        CallNumber cn = callNumberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CallNumber", id));
        cn.setActive(false);
        
        // Also deactivate children
        cn.getChildCallNumbers().forEach(child -> child.setActive(false));
        
        callNumberRepository.save(cn);
        log.info("Deactivated call number {} and its children", cn.getCode());
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "callNumbers", allEntries = true),
        @CacheEvict(value = "callNumberTree", allEntries = true)
    })
    public void activate(UUID id) {
        CallNumber cn = callNumberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CallNumber", id));
        cn.setActive(true);
        callNumberRepository.save(cn);
        log.info("Activated call number {}", cn.getCode());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LINK TEST CASES TO CALL NUMBER
    // ══════════════════════════════════════════════════════════════════════════

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "dashboard", allEntries = true),
        @CacheEvict(value = "callNumbers", allEntries = true)
    })
    public int linkTestCases(LinkTestCasesRequest req) {
        CallNumber cn = callNumberRepository.findById(req.getCallNumberId())
                .orElseThrow(() -> new ResourceNotFoundException("CallNumber", req.getCallNumberId()));

        List<TestCase> testCases = testCaseRepository.findAllById(req.getTestCaseIds());
        int count = 0;
        for (TestCase tc : testCases) {
            if (tc.getProject().getId().equals(cn.getProject().getId())) {
                tc.setCallNumber(cn);
                testCaseRepository.save(tc);
                count++;
            }
        }
        
        log.info("Linked {} test cases to call number {}", count, cn.getCode());
        return count;
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "dashboard", allEntries = true),
        @CacheEvict(value = "callNumbers", allEntries = true)
    })
    public int unlinkTestCases(List<UUID> testCaseIds) {
        List<TestCase> testCases = testCaseRepository.findAllById(testCaseIds);
        int count = 0;
        for (TestCase tc : testCases) {
            if (tc.getCallNumber() != null) {
                tc.setCallNumber(null);
                testCaseRepository.save(tc);
                count++;
            }
        }
        log.info("Unlinked {} test cases from call numbers", count);
        return count;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // BULK STATUS UPDATE (Issue #1, #2)
    // ══════════════════════════════════════════════════════════════════════════

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "dashboard", allEntries = true),
        @CacheEvict(value = "allDashboards", allEntries = true),
        @CacheEvict(value = "moduleBreakdown", allEntries = true),
        @CacheEvict(value = "teamProductivity", allEntries = true),
        @CacheEvict(value = "workload", allEntries = true)
    })
    public BulkStatusUpdateResponse bulkUpdateStatus(BulkStatusUpdateRequest req) {
        TestStatus newStatus;
        try {
            newStatus = TestStatus.valueOf(req.getNewStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status: " + req.getNewStatus());
        }

        List<String> successCodes = new ArrayList<>();
        List<BulkUpdateError> errors = new ArrayList<>();

        List<TestCase> testCases = testCaseRepository.findAllById(req.getTestCaseIds());
        
        for (TestCase tc : testCases) {
            try {
                // Validate status transition
                validateStatusTransition(tc.getStatus(), newStatus);
                tc.setStatus(newStatus);
                testCaseRepository.save(tc);
                successCodes.add(tc.getCode());
            } catch (Exception e) {
                errors.add(BulkUpdateError.builder()
                        .testCaseId(tc.getId())
                        .testCaseCode(tc.getCode())
                        .errorMessage(e.getMessage())
                        .build());
            }
        }

        log.info("Bulk status update: {} success, {} failures", successCodes.size(), errors.size());

        return BulkStatusUpdateResponse.builder()
                .successCount(successCodes.size())
                .failureCount(errors.size())
                .successCodes(successCodes)
                .errors(errors)
                .build();
    }

    private void validateStatusTransition(TestStatus from, TestStatus to) {
        // Allow most transitions for bulk update - only block truly invalid ones
        Set<TestStatus> terminalStatuses = Set.of(TestStatus.DEPRECATED);
        if (terminalStatuses.contains(from) && to != TestStatus.DRAFT) {
            throw new BadRequestException("Cannot change status from " + from + " to " + to);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ══════════════════════════════════════════════════════════════════════════

    private CallNumberResponse toResponse(CallNumber cn, boolean includeTestCaseCount) {
        Long testCaseCount = includeTestCaseCount 
                ? testCaseRepository.countByCallNumber(cn) 
                : null;

        return CallNumberResponse.builder()
                .id(cn.getId())
                .code(cn.getCode())
                .name(cn.getName())
                .description(cn.getDescription())
                .projectId(cn.getProject().getId())
                .projectName(cn.getProject().getName())
                .parentCallNumberId(cn.getParentCallNumber() != null ? cn.getParentCallNumber().getId() : null)
                .parentCallNumberCode(cn.getParentCallNumber() != null ? cn.getParentCallNumber().getCode() : null)
                .externalReference(cn.getExternalReference())
                .jiraKey(cn.getJiraKey())
                .active(cn.getActive())
                .sortOrder(cn.getSortOrder())
                .fullPath(cn.getFullPath())
                .isParent(cn.isParent())
                .testCaseCount(testCaseCount)
                .createdAt(cn.getCreatedAt())
                .updatedAt(cn.getUpdatedAt())
                .build();
    }

    private CallNumberResponse toResponseWithChildren(CallNumber cn) {
        List<CallNumberResponse> children = callNumberRepository.findByParentCallNumberAndActiveTrue(cn)
                .stream()
                .map(this::toResponseWithChildren)
                .collect(Collectors.toList());

        return CallNumberResponse.builder()
                .id(cn.getId())
                .code(cn.getCode())
                .name(cn.getName())
                .description(cn.getDescription())
                .projectId(cn.getProject().getId())
                .projectName(cn.getProject().getName())
                .parentCallNumberId(null)
                .parentCallNumberCode(null)
                .externalReference(cn.getExternalReference())
                .jiraKey(cn.getJiraKey())
                .active(cn.getActive())
                .sortOrder(cn.getSortOrder())
                .fullPath(cn.getFullPath())
                .isParent(true)
                .children(children)
                .testCaseCount(testCaseRepository.countByCallNumber(cn))
                .createdAt(cn.getCreatedAt())
                .updatedAt(cn.getUpdatedAt())
                .build();
    }
}
