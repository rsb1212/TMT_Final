package com.testmgmt.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTOs for Call Number Management operations.
 */
public class CallNumberDTOs {

    // ── Create Call Number Request ────────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateCallNumberRequest {
        
        @NotBlank(message = "Call number code is required")
        @Size(max = 50, message = "Code must be at most 50 characters")
        private String code;
        
        @NotBlank(message = "Call number name is required")
        @Size(max = 255, message = "Name must be at most 255 characters")
        private String name;
        
        private String description;
        
        @NotNull(message = "Project ID is required")
        private UUID projectId;
        
        /** Parent call number ID (null for root/parent call numbers) */
        private UUID parentCallNumberId;
        
        /** External reference (e.g., Jira ticket key) */
        private String externalReference;
        
        /** Jira key if linked */
        private String jiraKey;
        
        /** Sort order */
        private Integer sortOrder;
    }
    
    // ── Update Call Number Request ────────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateCallNumberRequest {
        
        @Size(max = 50, message = "Code must be at most 50 characters")
        private String code;
        
        @Size(max = 255, message = "Name must be at most 255 characters")
        private String name;
        
        private String description;
        
        private String externalReference;
        
        private String jiraKey;
        
        private Integer sortOrder;
        
        /** Move to different parent (null = make it a root call number) */
        private UUID newParentCallNumberId;
    }
    
    // ── Bulk Create Call Numbers Request ──────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkCreateCallNumbersRequest {
        
        @NotNull(message = "Project ID is required")
        private UUID projectId;
        
        @NotNull(message = "Call numbers list is required")
        private List<CallNumberItem> callNumbers;
        
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class CallNumberItem {
            @NotBlank(message = "Code is required")
            private String code;
            
            @NotBlank(message = "Name is required")
            private String name;
            
            private String description;
            
            /** Parent code (for creating hierarchy in bulk) */
            private String parentCode;
            
            private String externalReference;
            
            private String jiraKey;
        }
    }
    
    // ── Link Test Cases to Call Number Request ────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LinkTestCasesRequest {
        
        @NotNull(message = "Call number ID is required")
        private UUID callNumberId;
        
        @NotNull(message = "Test case IDs are required")
        private List<UUID> testCaseIds;
    }
    
    // ── Bulk Status Update Request (Issue #1) ─────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkStatusUpdateRequest {
        
        @NotNull(message = "Test case IDs are required")
        private List<UUID> testCaseIds;
        
        @NotBlank(message = "New status is required")
        private String newStatus;
        
        /** Optional comment for status change */
        private String comment;
    }
    
    // ── Search Call Numbers Request ───────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchCallNumbersRequest {
        
        private UUID projectId;
        
        private String query;
        
        /** Filter by parent only */
        private Boolean parentsOnly;
        
        /** Include inactive */
        private Boolean includeInactive;
        
        private Integer page;
        
        private Integer size;
    }
}
