package com.testmgmt.controller;

import com.testmgmt.entity.RepositoryModule;
import com.testmgmt.entity.RepositoryNode;
import com.testmgmt.entity.RepositoryNodeDocument;
import com.testmgmt.entity.User;
import com.testmgmt.service.RepositoryModuleService;
import com.testmgmt.dto.response.ResponseDTOs.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/repository-modules")
@RequiredArgsConstructor
@Slf4j
public class RepositoryModuleController {

    private final RepositoryModuleService repositoryModuleService;

    // ==================== MODULE ENDPOINTS ====================

    @GetMapping("/tree")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getModuleTree() {
        Map<String, Object> tree = repositoryModuleService.getModuleTree();
        return ResponseEntity.ok(ApiResponse.success(tree));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAllModules() {
        return ResponseEntity.ok(ApiResponse.success(repositoryModuleService.getAllModules()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getModuleById(@PathVariable UUID id) {
        return repositoryModuleService.getModuleById(id)
                .<ResponseEntity<ApiResponse<?>>>map(module -> ResponseEntity.ok(ApiResponse.success(module)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RepositoryModule>> createModule(@RequestBody Map<String, String> request) {
        RepositoryModule module = repositoryModuleService.createModule(
                request.get("name"),
                request.get("description"),
                request.get("icon"),
                request.get("color")
        );
        return ResponseEntity.ok(ApiResponse.success(module));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RepositoryModule>> updateModule(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        RepositoryModule module = repositoryModuleService.updateModule(
                id,
                request.get("name"),
                request.get("description"),
                request.get("icon"),
                request.get("color")
        );
        return ResponseEntity.ok(ApiResponse.success(module));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteModule(@PathVariable UUID id) {
        repositoryModuleService.deleteModule(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ==================== NODE ENDPOINTS ====================

    @GetMapping("/{moduleId}/nodes")
    public ResponseEntity<ApiResponse<?>> getRootNodes(@PathVariable UUID moduleId) {
        return ResponseEntity.ok(ApiResponse.success(repositoryModuleService.getRootNodes(moduleId)));
    }

    @GetMapping("/nodes/{nodeId}/children")
    public ResponseEntity<ApiResponse<?>> getChildNodes(@PathVariable UUID nodeId) {
        return ResponseEntity.ok(ApiResponse.success(repositoryModuleService.getChildNodes(nodeId)));
    }

    @PostMapping("/nodes")
    public ResponseEntity<ApiResponse<RepositoryNode>> createNode(@RequestBody Map<String, Object> request) {
        UUID moduleId = UUID.fromString((String) request.get("moduleId"));
        UUID parentId = request.get("parentId") != null 
                ? UUID.fromString((String) request.get("parentId")) 
                : null;
        String name = (String) request.get("name");
        String description = (String) request.get("description");
        String icon = (String) request.get("icon");
        String nodeType = (String) request.get("nodeType");
        boolean allowAddNew = request.get("allowAddNew") != null 
                ? (Boolean) request.get("allowAddNew") 
                : false;

        RepositoryNode node = repositoryModuleService.createNode(
                moduleId, parentId, name, description, icon, nodeType, allowAddNew);
        return ResponseEntity.ok(ApiResponse.success(node));
    }

    @PutMapping("/nodes/{nodeId}")
    public ResponseEntity<ApiResponse<RepositoryNode>> updateNode(
            @PathVariable UUID nodeId,
            @RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        String description = (String) request.get("description");
        String icon = (String) request.get("icon");
        boolean allowAddNew = request.get("allowAddNew") != null 
                ? (Boolean) request.get("allowAddNew") 
                : false;

        RepositoryNode node = repositoryModuleService.updateNode(nodeId, name, description, icon, allowAddNew);
        return ResponseEntity.ok(ApiResponse.success(node));
    }

    @DeleteMapping("/nodes/{nodeId}")
    public ResponseEntity<ApiResponse<Void>> deleteNode(@PathVariable UUID nodeId) {
        repositoryModuleService.deleteNode(nodeId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ==================== DOCUMENT ENDPOINTS ====================

    @GetMapping("/nodes/{nodeId}/documents")
    public ResponseEntity<ApiResponse<?>> getDocuments(@PathVariable UUID nodeId) {
        return ResponseEntity.ok(ApiResponse.success(repositoryModuleService.getDocuments(nodeId)));
    }

    @PostMapping("/nodes/{nodeId}/documents")
    public ResponseEntity<ApiResponse<RepositoryNodeDocument>> uploadDocument(
            @PathVariable UUID nodeId,
            @RequestParam(required = false) UUID projectId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String description,
            @AuthenticationPrincipal User user) {
        try {
            RepositoryNodeDocument document = repositoryModuleService.uploadDocument(
                    nodeId, projectId, file, description, user);
            return ResponseEntity.ok(ApiResponse.success(document));
        } catch (Exception e) {
            log.error("Error uploading document", e);
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to upload document: " + e.getMessage()));
        }
    }

    @PutMapping("/documents/{documentId}/archive")
    public ResponseEntity<ApiResponse<Void>> archiveDocument(@PathVariable UUID documentId) {
        repositoryModuleService.archiveDocument(documentId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/documents/{documentId}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable UUID documentId) {
        repositoryModuleService.deleteDocument(documentId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ==================== SEED ENDPOINT (Admin only) ====================

    @PostMapping("/seed")
    public ResponseEntity<ApiResponse<String>> seedModules() {
        repositoryModuleService.seedDefaultModules();
        return ResponseEntity.ok(ApiResponse.success("Modules seeded successfully"));
    }
}
