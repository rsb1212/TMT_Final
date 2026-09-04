package com.testmgmt.config;

import com.testmgmt.entity.User;
import com.testmgmt.enums.UserRole;
import com.testmgmt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class DataInitializer implements CommandLineRunner {

    /** Fixed UUID of the "DEFAULT" tenant created by V3__add_multi_tenancy.sql. */
    private static final UUID DEFAULT_TENANT_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.default-admin.enabled:false}")
    private boolean adminEnabled;

    @Value("${app.default-admin.email:}")
    private String adminEmail;

    @Value("${app.default-admin.username:admin}")
    private String adminUsername;

    @Value("${app.default-admin.password:}")
    private String adminPassword;

    @Value("${app.default-admin.fullname:Platform Admin}")
    private String adminFullName;

    @Value("${app.default-admin.team:Platform}")
    private String adminTeam;

    @Override
    public void run(String... args) {
        backfillMissingTenantIds();
        seedDefaultAdmin();
    }

    /**
     * Guardrail for multi-tenant queries.
     *
     * Every service filters by {@code TenantContext.getCurrentTenant()}, which
     * comes from the JWT {@code tenantId} claim, which is copied from
     * {@code users.tenant_id} at login. If any user row has
     * {@code tenant_id = NULL} (created before V3 ran, or via a code path that
     * forgot to set it), that user's JWT will carry no tenant and every list
     * endpoint will silently return an empty result — the classic
     * "database has data but the UI shows nothing" symptom.
     *
     * On startup we back-fill any such rows to the DEFAULT tenant, which is
     * the same value V3 assigned to all pre-existing rows. This is idempotent
     * and safe to run on every boot.
     */
    private void backfillMissingTenantIds() {
        try {
            Integer users = jdbcTemplate.update(
                    "UPDATE users SET tenant_id = ? WHERE tenant_id IS NULL",
                    DEFAULT_TENANT_ID);
            if (users != null && users > 0) {
                log.warn("🔧  Back-filled tenant_id on {} user row(s) to DEFAULT tenant. "
                        + "Affected users must log out and log back in to receive a JWT with the tenant claim.",
                        users);
            }
        } catch (Exception ex) {
            // Table may not exist yet (e.g. very first boot before migrations). Not fatal.
            log.debug("Skipped tenant back-fill: {}", ex.getMessage());
        }
    }

    /**
     * Create default admin only when explicitly enabled via environment config.
     * No hardcoded passwords — credentials come from environment variables only.
     */
    private void seedDefaultAdmin() {
        if (!adminEnabled) {
            log.info("Default admin creation is disabled. Set DEFAULT_ADMIN_ENABLED=true to create.");
            return;
        }

        if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            log.warn("⚠️  DEFAULT_ADMIN_ENABLED is true but email/password not configured. Skipping admin creation.");
            return;
        }

        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .username(adminUsername)
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .fullName(adminFullName)
                    .role(UserRole.ADMIN)
                    .team(adminTeam)
                    .tenantId(DEFAULT_TENANT_ID)   // ← critical: without this the admin sees no data
                    .active(true)
                    .build();
            userRepository.save(admin);
            log.info("✅  Default admin created: {} (tenant: DEFAULT)", adminEmail);
        }
    }
}


