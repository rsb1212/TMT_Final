package com.testmgmt.controller;

import com.testmgmt.dto.response.ResponseDTOs.*;
import com.testmgmt.enums.AttachmentEntityType;
import com.testmgmt.service.AttachmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Attachments", description = "Upload screenshots and evidence to executions and defects")
public class AttachmentController {

    private final AttachmentService attachmentService;

    @PostMapping("/executions/{id}/attachments")
    @Operation(summary = "Upload attachment to a test execution")
    public ResponseEntity<ApiResponse<AttachmentResponse>> uploadToExecution(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails user) throws IOException {
        return ResponseEntity.ok(ApiResponse.success(
                attachmentService.upload(AttachmentEntityType.TEST_EXECUTION, id, file, user.getUsername())));
    }

    @PostMapping("/defects/{id}/attachments")
    @Operation(summary = "Upload attachment to a defect")
    public ResponseEntity<ApiResponse<AttachmentResponse>> uploadToDefect(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails user) throws IOException {
        return ResponseEntity.ok(ApiResponse.success(
                attachmentService.upload(AttachmentEntityType.DEFECT, id, file, user.getUsername())));
    }

    @GetMapping("/executions/{id}/attachments")
    @Operation(summary = "List attachments for a test execution")
    public ResponseEntity<ApiResponse<List<AttachmentResponse>>> listForExecution(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                attachmentService.list(AttachmentEntityType.TEST_EXECUTION, id)));
    }

    @GetMapping("/defects/{id}/attachments")
    @Operation(summary = "List attachments for a defect")
    public ResponseEntity<ApiResponse<List<AttachmentResponse>>> listForDefect(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                attachmentService.list(AttachmentEntityType.DEFECT, id)));
    }

    @GetMapping("/attachments/{id}/download")
    @Operation(summary = "Download an attachment file — accessible to all authenticated users (MANAGER, ADMIN, SME, TESTER can download Tester-uploaded evidence)")
    public ResponseEntity<Resource> download(@PathVariable UUID id) throws java.net.MalformedURLException {
        Resource resource = attachmentService.download(id);
        @SuppressWarnings("null")
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        String filename = resource.getFilename() != null ? resource.getFilename() : "attachment";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(resource);
    }

    /**
     * Download test evidence as PDF - converts any file format to PDF.
     * All test evidence downloads will be in PDF format for standardization.
     */
    @GetMapping("/attachments/{id}/download-pdf")
    @Operation(summary = "Download test evidence as PDF — all files are converted to PDF format for standardized evidence")
    public ResponseEntity<ByteArrayResource> downloadAsPdf(@PathVariable UUID id) throws IOException {
        ByteArrayResource pdfResource = attachmentService.downloadAsPdf(id);
        String pdfFilename = attachmentService.getPdfFileName(id);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + pdfFilename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfResource.contentLength())
                .body(pdfResource);
    }

    @DeleteMapping("/attachments/{id}")
    @Operation(summary = "Delete an attachment — uploader, MANAGER, ADMIN can delete")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails user) {
        attachmentService.delete(id, user.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Attachment deleted"));
    }
}
