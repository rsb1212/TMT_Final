package com.testmgmt.entity;

import com.testmgmt.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "users",
        indexes = {
                @Index(name = "idx_users_email", columnList = "email"),
                @Index(name = "idx_users_role", columnList = "role"),
                @Index(name = "idx_users_tenant", columnList = "tenant_id"),
                @Index(name = "idx_users_team", columnList = "team_id")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User extends BaseEntity {

    @Column(name = "tenant_id")
    private UUID tenantId;

    /** Team this user belongs to */
    @Column(name = "team_id")
    private UUID teamId;

    @Column(name = "username", nullable = false, length = 50)
    private String username;

    @Column(name = "email", nullable = false, length = 120)
    private String email;

    @Column(name = "password_hash", nullable = false, columnDefinition = "TEXT")
    private String passwordHash;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private UserRole role;

    @Column(name = "team", length = 60)
    private String team;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;
}
