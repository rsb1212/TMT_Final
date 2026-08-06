package com.testmgmt.dto;

import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTOs for the hierarchical Repository Module system
 */
public class RepositoryModuleDTOs {

    // ═══════════════════════════════════════════════════════════════════════════
    // REQUEST DTOs
    // ═══════════════════════════════════════════════════════════════════════════

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateModuleRequest {
        private String name;
        private String description;
        private String icon;
        private String color;
        private Integer sortOrder;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateModuleRequest {
        private String name;
        private String description;
        private String icon;
        private String color;
        private Integer sortOrder;
        private Boolean isActive;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateNodeRequest {
        private UUID moduleId;
        private UUID parentNodeId;
        private String name;
        private String description;
        private String icon;
        private String nodeType; // FOLDER or DOCUMENT_CONTAINER
        private Integer sortOrder;
        private Boolean allowAddNew;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateNodeRequest {
        private String name;
        private String description;
        private String icon;
        private Integer sortOrder;
        private Boolean allowAddNew;
        private Boolean isActive;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RESPONSE DTOs
    // ═══════════════════════════════════════════════════════════════════════════

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ModuleResponse {
        private UUID id;
        private String name;
        private String description;
        private String icon;
        private String color;
        private Integer sortOrder;
        private Boolean isActive;
        private List<NodeResponse> categories;
        private Instant createdAt;
        private Instant updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NodeResponse {
        private UUID id;
        private String name;
        private String description;
        private String icon;
        private String nodeType;
        private String path;
        private Integer depth;
        private Integer sortOrder;
        private Boolean allowAddNew;
        private Boolean isActive;
        private List<NodeResponse> children;
        private Long documentCount;
        private Instant createdAt;
        private Instant updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NodeDocumentResponse {
        private UUID id;
        private UUID nodeId;
        private String nodePath;
        private UUID projectId;
        private String projectName;
        private String fileName;
        private String originalName;
        private Long fileSize;
        private String mimeType;
        private Integer version;
        private String description;
        private String uploadedBy;
        private Instant uploadedAt;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ModuleTreeResponse {
        private List<ModuleResponse> modules;
        private int totalModules;
        private int totalNodes;
    }
}
