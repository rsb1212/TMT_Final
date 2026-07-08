package com.testmgmt.service;

import com.testmgmt.dto.response.ResponseDTOs.RepositoryDocumentResponse;
import com.testmgmt.entity.Project;
import com.testmgmt.entity.RepositoryDocument;
import com.testmgmt.entity.User;
import com.testmgmt.enums.RepositoryCategory;
import com.testmgmt.exception.ResourceNotFoundException;
import com.testmgmt.repository.ProjectRepository;
import com.testmgmt.repository.RepositoryDocumentRepository;
import com.testmgmt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class RepositoryService {

    private final RepositoryDocumentRepository repositoryDocumentRepository;
    private final ProjectRepository            projectRepository;
    private final UserRepository               userRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /** Upload a document to the central repository */
    @Transactional
    public RepositoryDocumentResponse upload(UUID projectId, RepositoryCategory category,
                                             String description, MultipartFile file,
                                             String uploaderEmail) throws IOException {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        User uploader = userRepository.findByEmail(uploaderEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", uploaderEmail));

        // Determine current max version for same file in same project/category
        List<RepositoryDocument> existing = repositoryDocumentRepository
                .findByProjectAndCategoryOrderByUploadedAtDesc(project, category);

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        int nextVersion = existing.stream()
                .filter(d -> originalName.equals(d.getOriginalName()))
                .mapToInt(RepositoryDocument::getVersion)
                .max()
                .orElse(0) + 1;

        // Store file: uploads/repository/{projectId}/{category}/{uuid}_{filename}
        Path dir = Paths.get(uploadDir, "repository", projectId.toString(),
                             category.name().toLowerCase());
        Files.createDirectories(dir);

        String safeFilename = UUID.randomUUID() + "_" +
                originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path target = dir.resolve(safeFilename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        RepositoryDocument doc = RepositoryDocument.builder()
                .project(project)
                .category(category)
                .originalName(originalName)
                .fileName(safeFilename)
                .filePath(target.toString())
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .version(nextVersion)
                .description(description)
                .uploadedBy(uploader)
                .status("ACTIVE")
                .build();

        return toResponse(repositoryDocumentRepository.save(doc));
    }

    /** List all active documents for a project, optionally filtered by category */
    @Transactional(readOnly = true)
    public List<RepositoryDocumentResponse> list(UUID projectId, RepositoryCategory category) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        List<RepositoryDocument> docs = (category != null)
                ? repositoryDocumentRepository.findByProjectAndCategoryOrderByUploadedAtDesc(project, category)
                : repositoryDocumentRepository.findByProjectAndStatusOrderByUploadedAtDesc(project, "ACTIVE");

        return docs.stream()
                .filter(d -> "ACTIVE".equals(d.getStatus()))
                .map(this::toResponse)
                .toList();
    }

    /** Download a document by its ID */
    @Transactional(readOnly = true)
    public Resource download(UUID docId) throws MalformedURLException {
        RepositoryDocument doc = repositoryDocumentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("RepositoryDocument", docId));

        Path path = Paths.get(doc.getFilePath());
        Resource resource = new UrlResource(path.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            throw new RuntimeException("File not found or not readable: " + doc.getOriginalName());
        }
        return resource;
    }

    /** Soft-delete a document (set status = ARCHIVED) — uploader, MANAGER, or ADMIN only */
    @Transactional
    public void archive(UUID docId, String requesterEmail) {
        RepositoryDocument doc = repositoryDocumentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("RepositoryDocument", docId));
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", requesterEmail));

        boolean isOwner   = doc.getUploadedBy().getEmail().equals(requesterEmail);
        boolean isPriv    = List.of("MANAGER", "ADMIN").contains(requester.getRole().name());
        if (!isOwner && !isPriv) {
            throw new AccessDeniedException("Only the uploader, a MANAGER, or ADMIN can archive this document");
        }
        doc.setStatus("ARCHIVED");
        repositoryDocumentRepository.save(doc);
    }

    /** Hard-delete — ADMIN only, or uploader when version == 1 and no activity */
    @Transactional
    public void delete(UUID docId, String requesterEmail) {
        RepositoryDocument doc = repositoryDocumentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("RepositoryDocument", docId));
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", requesterEmail));

        boolean isAdmin = "ADMIN".equals(requester.getRole().name());
        boolean isOwner = doc.getUploadedBy().getEmail().equals(requesterEmail);
        if (!isAdmin && !isOwner) {
            throw new AccessDeniedException("Only ADMIN or the uploader can permanently delete this document");
        }

        // Delete physical file
        try { Files.deleteIfExists(Paths.get(doc.getFilePath())); }
        catch (IOException e) { log.warn("Could not delete file {}: {}", doc.getFilePath(), e.getMessage()); }

        repositoryDocumentRepository.delete(doc);
    }

    private RepositoryDocumentResponse toResponse(RepositoryDocument doc) {
        return RepositoryDocumentResponse.builder()
                .id(doc.getId())
                .projectId(doc.getProject().getId())
                .projectName(doc.getProject().getName())
                .category(doc.getCategory().name())
                .originalName(doc.getOriginalName())
                .fileName(doc.getFileName())
                .fileSize(doc.getFileSize())
                .mimeType(doc.getMimeType())
                .version(doc.getVersion())
                .description(doc.getDescription())
                .status(doc.getStatus())
                .uploadedBy(doc.getUploadedBy().getEmail())
                .uploadedAt(doc.getUploadedAt())
                .createdAt(doc.getCreatedAt())
                .build();
    }
}
