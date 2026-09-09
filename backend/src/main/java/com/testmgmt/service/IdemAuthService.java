package com.testmgmt.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.testmgmt.dto.request.AuthDTOs.LoginRequest;
import com.testmgmt.dto.response.ResponseDTOs.AuthResponse;
import com.testmgmt.dto.response.ResponseDTOs.TenantResponse;
import com.testmgmt.entity.Tenant;
import com.testmgmt.entity.User;
import com.testmgmt.exception.BadRequestException;
import com.testmgmt.repository.TenantRepository;
import com.testmgmt.repository.UserRepository;
import com.testmgmt.security.JwtUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * IDEM credential authentication.
 *
 * <p>Unlike {@link com.testmgmt.controller.IdemAuthController}'s OIDC redirect
 * flow, this service performs a direct <em>username&nbsp;+&nbsp;password</em>
 * login that is validated against the local database:
 *
 * <ol>
 *   <li>Look the user up by their User&nbsp;ID (domain email); fall back to the
 *       legacy {@code username} column.</li>
 *   <li>Reject disabled accounts.</li>
 *   <li>Verify the supplied password against the stored BCrypt hash.</li>
 *   <li>Mint a JWT that carries the user's {@code role} and {@code tenantId} so
 *       the frontend can route the session based on the role.</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class IdemAuthService {

    private final UserRepository       userRepository;
    private final TenantRepository     tenantRepository;
    private final PasswordEncoder      passwordEncoder;
    private final JwtUtil              jwtUtil;
    private final UserDetailsService   userDetailsService;

    /**
     * Validate the given credentials against the DB and, on success, issue a
     * role-aware JWT.
     *
     * @param request the login payload; {@code email} is the User ID (domain
     *                email) and {@code password} is the raw password.
     * @return an {@link AuthResponse} containing the JWT, the user (with role)
     *         and the tenant.
     * @throws BadRequestException if the credentials are missing/invalid or the
     *                             account is disabled.
     */
    @Transactional(readOnly = true)
    public AuthResponse authenticate(LoginRequest request) {
        final String userId   = request != null ? trimToNull(request.getEmail())    : null;
        final String password = request != null ? request.getPassword()             : null;

        if (userId == null || password == null || password.isBlank()) {
            throw new BadRequestException("User ID and password are required");
        }

        // 1) Resolve the user — username is kept equal to the email, but we also
        //    accept the legacy username column for backward compatibility.
        User user = userRepository.findByEmail(userId)
                .or(() -> userRepository.findByUsername(userId))
                .orElseThrow(() -> {
                    log.warn("IDEM credential login failed — unknown user '{}'", userId);
                    return new BadRequestException("Invalid User ID or password");
                });

        // 2) Reject disabled accounts.
        if (Boolean.FALSE.equals(user.getActive())) {
            log.warn("IDEM credential login blocked — account disabled '{}'", user.getEmail());
            throw new BadRequestException("Your account is disabled. Contact an administrator.");
        }

        // 3) Verify the password against the stored BCrypt hash.
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            log.warn("IDEM credential login failed — bad password for '{}'", user.getEmail());
            throw new BadRequestException("Invalid User ID or password");
        }

        // 4) Mint a JWT carrying role + tenant so the app can route by role.
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String tenantId = user.getTenantId() != null ? user.getTenantId().toString() : null;
        String token    = jwtUtil.generateToken(userDetails, tenantId);

        TenantResponse tenantResponse = loadTenant(user);

        log.info("IDEM credential login OK — user='{}' role={} tenant={}",
                user.getEmail(), user.getRole(), tenantId);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(AuthService.toUserResponse(user))
                .tenant(tenantResponse)
                .build();
    }

    private TenantResponse loadTenant(User user) {
        if (user.getTenantId() == null) {
            return null;
        }
        Tenant tenant = tenantRepository.findById(user.getTenantId()).orElse(null);
        if (tenant == null) {
            return null;
        }
        return TenantResponse.builder()
                .id(tenant.getId())
                .code(tenant.getCode())
                .name(tenant.getName())
                .description(tenant.getDescription())
                .active(tenant.getActive())
                .build();
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
