package com.testmgmt.controller;

import com.testmgmt.dto.response.ResponseDTOs.*;
import com.testmgmt.enums.NotificationType;
import com.testmgmt.enums.UserRole;
import com.testmgmt.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notification bell — assignments, approvals, due dates")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/me")
    @Operation(summary = "Get all notifications for current user")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getMyNotifications(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getMyNotifications(user.getUsername())));
    }

    @GetMapping("/me/unread-count")
    @Operation(summary = "Get unread notification count for bell badge")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal UserDetails user) {
        long count = notificationService.getUnreadCount(user.getUsername());
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails user) {
        notificationService.markRead(id, user.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Marked as read"));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<Void>> markAllRead(
            @AuthenticationPrincipal UserDetails user) {
        notificationService.markAllRead(user.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read"));
    }

    // ─── Admin Broadcast Endpoints ────────────────────────────────────────────

    @PostMapping("/broadcast/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Broadcast notification to all active users (Admin/Manager only)")
    public ResponseEntity<ApiResponse<Void>> broadcastToAll(@RequestBody BroadcastRequest request) {
        notificationService.broadcastToAll(
                request.getType() != null ? request.getType() : NotificationType.ASSIGNED,
                request.getTitle(),
                request.getMessage(),
                request.getEntityType(),
                request.getEntityId()
        );
        return ResponseEntity.ok(ApiResponse.ok("Notification broadcasted to all users"));
    }

    @PostMapping("/broadcast/role/{role}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Broadcast notification to users with specific role (Admin/Manager only)")
    public ResponseEntity<ApiResponse<Void>> broadcastToRole(
            @PathVariable UserRole role,
            @RequestBody BroadcastRequest request) {
        notificationService.broadcastToRole(
                role,
                request.getType() != null ? request.getType() : NotificationType.ASSIGNED,
                request.getTitle(),
                request.getMessage(),
                request.getEntityType(),
                request.getEntityId()
        );
        return ResponseEntity.ok(ApiResponse.ok("Notification broadcasted to role: " + role));
    }

    @PostMapping("/broadcast/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Broadcast notification to specific users (Admin/Manager only)")
    public ResponseEntity<ApiResponse<Void>> broadcastToUsers(@RequestBody BroadcastToUsersRequest request) {
        notificationService.broadcastToUsers(
                request.getUserIds(),
                request.getType() != null ? request.getType() : NotificationType.ASSIGNED,
                request.getTitle(),
                request.getMessage(),
                request.getEntityType(),
                request.getEntityId()
        );
        return ResponseEntity.ok(ApiResponse.ok("Notification broadcasted to " + request.getUserIds().size() + " users"));
    }

    @PostMapping("/broadcast/team/{teamId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Broadcast notification to a team (Admin/Manager only)")
    public ResponseEntity<ApiResponse<Void>> broadcastToTeam(
            @PathVariable UUID teamId,
            @RequestBody BroadcastRequest request) {
        notificationService.broadcastToTeam(
                teamId,
                request.getType() != null ? request.getType() : NotificationType.ASSIGNED,
                request.getTitle(),
                request.getMessage(),
                request.getEntityType(),
                request.getEntityId()
        );
        return ResponseEntity.ok(ApiResponse.ok("Notification broadcasted to team"));
    }

    // ─── Request DTOs ────────────────────────────────────────────────────────

    @Data
    public static class BroadcastRequest {
        private NotificationType type;
        private String title;
        private String message;
        private String entityType;
        private UUID entityId;
    }

    @Data
    public static class BroadcastToUsersRequest {
        private List<UUID> userIds;
        private NotificationType type;
        private String title;
        private String message;
        private String entityType;
        private UUID entityId;
    }
}
