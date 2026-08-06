package com.testmgmt.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.UUID;

/**
 * Request DTOs for Central Repository Module and Category management.
 */
public class RepositoryDTOs {

    private RepositoryDTOs() {}

    // ═══════════════════════════════════════════════════════════════════════════
    // MODULE REQUESTS
    // ═══════════════════════════════════════════════════════════════════════════

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateModuleRequest {
        @NotBlank(message = "Module name is required")
        @Size(max = 100, message = "Module name must be at most 100 characters")
        private String name;

        @NotBlank(message = "Display name is required")
        @Size(max = 150, message = "Display name must be at most 150 characters")
        private String displayName;

        @Size(max = 500, message = "Description must be at most 500 characters")
        private String description;

        @Size(max = 50, message = "Icon must be at most 50 characters")
        private String icon;

        @Size(max = 20, message = "Color must be at most 20 characters")
        private String color;

        private Integer sortOrder;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateModuleRequest {
        @Size(max = 150, message = "Display name must be at most 150 characters")
        private String displayName;

        @Size(max = 500, message = "Description must be at most 500 characters")
        private String description;

        @Size(max = 50, message = "Icon must be at most 50 characters")
        private String icon;

        @Size(max = 20, message = "Color must be at most 20 characters")
        private String color;

        private Integer sortOrder;
        private Boolean active;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CATEGORY REQUESTS
    // ═══════════════════════════════════════════════════════════════════════════

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateCategoryRequest {
        @NotBlank(message = "Category name is required")
        @Size(max = 100, message = "Category name must be at most 100 characters")
        private String name;

        @NotBlank(message = "Display name is required")
        @Size(max = 150, message = "Display name must be at most 150 characters")
        private String displayName;

        @Size(max = 500, message = "Description must be at most 500 characters")
        private String description;

        @Size(max = 50, message = "Icon must be at most 50 characters")
        private String icon;

        @Size(max = 20, message = "Color must be at most 20 characters")
        private String color;

        private Integer sortOrder;

        /** Parent category ID for creating subcategories */
        private UUID parentId;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateCategoryRequest {
        @Size(max = 150, message = "Display name must be at most 150 characters")
        private String displayName;

        @Size(max = 500, message = "Description must be at most 500 characters")
        private String description;

        @Size(max = 50, message = "Icon must be at most 50 characters")
        private String icon;

        @Size(max = 20, message = "Color must be at most 20 characters")
        private String color;

        private Integer sortOrder;
        private Boolean active;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DOCUMENT UPLOAD REQUEST (Enhanced)
    // ═══════════════════════════════════════════════════════════════════════════

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UploadDocumentRequest {
        /** Category ID where the document will be uploaded */
        private UUID categoryId;

        @Size(max = 1000, message = "Description must be at most 1000 characters")
        private String description;

        /** Optional tags for the document */
        private String[] tags;
    }
}
