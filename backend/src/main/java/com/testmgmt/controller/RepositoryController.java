package com.testmgmt.controller;

import com.testmgmt.dto.response.ResponseDTOs.*;
import com.testmgmt.enums.RepositoryCategory;
import com.testmgmt.service.RepositoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/repository")
@RequiredArgsConstructor
@Tag(name = "Central Repository", description = "Upload, browse, and download shared project documents")
public class RepositoryController {

    private final RepositoryService repositoryService;

    /** Upload a document to the central repository */
    @PostMapping(value = "/projects/{projectId}/documents", consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('TESTER','MANAGER','ADMIN','SME')")
    @Operation(summary = "Upload a document to the central repository")
    public ResponseEntity<ApiResponse<RepositoryDocumentResponse>> upload(
            @PathVariable UUID projectId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("category") RepositoryCategory category,
            @RequestParam(value = "description", required = false) String description,
            @AuthenticationPrincipal UserDetails user) throws IOException {

        RepositoryDocumentResponse response =
                repositoryService.upload(projectId, category, description, file, user.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /** List documents for a project, optionally filtered by category */
    @GetMapping("/projects/{projectId}/documents")
    @PreAuthorize("hasAnyRole('TESTER','MANAGER','ADMIN','SME')")
    @Operation(summary = "List documents in the central repository for a project")
    public ResponseEntity<ApiResponse<List<RepositoryDocumentResponse>>> list(
            @PathVariable UUID projectId,
            @RequestParam(value = "category", required = false) RepositoryCategory category) {

        return ResponseEntity.ok(ApiResponse.success(
                repositoryService.list(projectId, category)));
    }

    /** Download a document */
    @GetMapping("/documents/{docId}/download")
    @PreAuthorize("hasAnyRole('TESTER','MANAGER','ADMIN','SME')")
    @Operation(summary = "Download a document from the central repository")
    public ResponseEntity<Resource> download(@PathVariable UUID docId) throws java.net.MalformedURLException {
        Resource resource = repositoryService.download(docId);
        String filename = resource.getFilename() != null ? resource.getFilename() : "document";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    /** Archive (soft-delete) a document — MANAGER/ADMIN only */
    @PatchMapping("/documents/{docId}/archive")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "Archive a repository document (soft delete) — MANAGER/ADMIN only")
    public ResponseEntity<ApiResponse<Void>> archive(
            @PathVariable UUID docId,
            @AuthenticationPrincipal UserDetails user) {
        repositoryService.archive(docId, user.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Document archived"));
    }

    /** Hard-delete a document — ADMIN or uploader only */
    @DeleteMapping("/documents/{docId}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "Permanently delete a repository document (ADMIN or uploader)")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID docId,
            @AuthenticationPrincipal UserDetails user) {
        repositoryService.delete(docId, user.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Document deleted"));
    }

    /** List all supported categories */
    @GetMapping("/categories")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get all repository categories")
    public ResponseEntity<ApiResponse<RepositoryCategory[]>> categories() {
        return ResponseEntity.ok(ApiResponse.success(RepositoryCategory.values()));
    }
}
