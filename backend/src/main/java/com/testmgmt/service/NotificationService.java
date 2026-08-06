package com.testmgmt.service;

import com.testmgmt.dto.response.ResponseDTOs.NotificationResponse;
import com.testmgmt.entity.Notification;
import com.testmgmt.entity.User;
import com.testmgmt.enums.NotificationType;
import com.testmgmt.enums.UserRole;
import com.testmgmt.exception.ResourceNotFoundException;
import com.testmgmt.repository.NotificationRepository;
import com.testmgmt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository         userRepository;

    // ── Create a notification for a single user ─────────────────────
    @Transactional
    public void create(User user, NotificationType type, String title, String message,
                       String entityType, UUID entityId) {
        Notification n = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .entityType(entityType)
                .entityId(entityId)
                .isRead(false)
                .build();
        notificationRepository.save(n);
        log.debug("Created notification for user {}: {}", user.getEmail(), title);
    }

    // ── Create notification for user by ID ─────────────────────────
    @Transactional
    public void createForUser(UUID userId, NotificationType type, String title, String message,
                              String entityType, UUID entityId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        create(user, type, title, message, entityType, entityId);
    }

    // ── Broadcast notification to ALL active users ─────────────────
    @Transactional
    public void broadcastToAll(NotificationType type, String title, String message,
                               String entityType, UUID entityId) {
        List<User> allActiveUsers = userRepository.findByActiveTrue();
        log.info("Broadcasting notification to {} active users: {}", allActiveUsers.size(), title);
        for (User user : allActiveUsers) {
            create(user, type, title, message, entityType, entityId);
        }
    }

    // ── Broadcast notification to users with specific role ─────────
    @Transactional
    public void broadcastToRole(UserRole role, NotificationType type, String title, String message,
                                String entityType, UUID entityId) {
        List<User> usersWithRole = userRepository.findByRoleAndActiveTrue(role);
        log.info("Broadcasting notification to {} users with role {}: {}", usersWithRole.size(), role, title);
        for (User user : usersWithRole) {
            create(user, type, title, message, entityType, entityId);
        }
    }

    // ── Broadcast notification to multiple users ───────────────────
    @Transactional
    public void broadcastToUsers(List<UUID> userIds, NotificationType type, String title, String message,
                                 String entityType, UUID entityId) {
        log.info("Broadcasting notification to {} users: {}", userIds.size(), title);
        for (UUID userId : userIds) {
            try {
                createForUser(userId, type, title, message, entityType, entityId);
            } catch (ResourceNotFoundException e) {
                log.warn("User not found for notification: {}", userId);
            }
        }
    }

    // ── Broadcast notification to team members ─────────────────────
    @Transactional
    public void broadcastToTeam(UUID teamId, NotificationType type, String title, String message,
                                String entityType, UUID entityId) {
        List<User> teamMembers = userRepository.findByTeamIdAndActiveTrue(teamId);
        log.info("Broadcasting notification to {} team members: {}", teamMembers.size(), title);
        for (User user : teamMembers) {
            create(user, type, title, message, entityType, entityId);
        }
    }

    // ── Get all for current user ─────────────────────────────
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(String email) {
        User user = getUser(email);
        return notificationRepository
                .findByUserOrderByCreatedAtDesc(user)
                .stream().map(this::toResponse).toList();
    }

    // ── Unread count (for bell badge) ────────────────────────
    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        User user = getUser(email);
        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    // ── Mark single as read ──────────────────────────────────
    @Transactional
    public void markRead(UUID notifId, String email) {
        Notification n = notificationRepository.findById(notifId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notifId));
        if (!n.getUser().getEmail().equals(email)) {
            throw new ResourceNotFoundException("Notification", notifId);
        }
        n.setIsRead(true);
        notificationRepository.save(n);
    }

    // ── Mark all read ────────────────────────────────────────
    @Transactional
    public void markAllRead(String email) {
        User user = getUser(email);
        notificationRepository.markAllReadForUser(user);
    }

    // ── Helper ───────────────────────────────────────────────
    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
    }

    public NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .entityType(n.getEntityType())
                .entityId(n.getEntityId())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
