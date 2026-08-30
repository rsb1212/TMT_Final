package com.testmgmt.config;

import com.testmgmt.entity.User;
import com.testmgmt.enums.UserRole;
import com.testmgmt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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
        seedDefaultAdmin();
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
                    .active(true)
                    .build();
            userRepository.save(admin);
            log.info("✅  Default admin created: {}", adminEmail);
        }
    }
}

