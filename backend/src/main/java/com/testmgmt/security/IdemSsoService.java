package com.testmgmt.security;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.testmgmt.entity.User;
import com.testmgmt.enums.UserRole;
import com.testmgmt.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * IDEM / RH-SSO (Keycloak) OIDC integration — Authorization Code + PKCE flow.
 *
 * <p>This replaces the local username/password (JWT) login. The flow is:
 * <ol>
 *   <li>{@link #buildAuthorizationRequest} — builds the RH-SSO authorize URL and
 *       generates a PKCE verifier + state (stored in the HTTP session).</li>
 *   <li>The browser authenticates on the RH-SSO server and is redirected back to
 *       the backend callback with an authorization {@code code}.</li>
 *   <li>{@link #handleCallback} — exchanges the code (public client, PKCE, no
 *       secret) for tokens, reads the ID token claims, provisions/loads a local
 *       {@link User} and mints the application session JWT via {@link JwtUtil}.</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class IdemSsoService {

    private static final Logger log = LoggerFactory.getLogger(IdemSsoService.class);

    public static final String SESSION_STATE    = "IDEM_STATE";
    public static final String SESSION_VERIFIER = "IDEM_PKCE_VERIFIER";

    private final UserRepository       userRepository;
    private final UserDetailsService   userDetailsService;
    private final PasswordEncoder      passwordEncoder;
    private final JwtUtil              jwtUtil;
    private final ObjectMapper         objectMapper = new ObjectMapper();

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${app.idem.issuer-uri}")
    private String issuerUri;

    @Value("${app.idem.client-id}")
    private String clientId;

    @Value("${app.idem.redirect-uri}")
    private String redirectUri;

    @Value("${app.idem.scope:openid profile email}")
    private String scope;

    @Value("${app.idem.default-role:TESTER}")
    private String defaultRole;

    @Value("${app.idem.default-tenant-id:00000000-0000-0000-0000-000000000001}")
    private String defaultTenantId;

    private final SecureRandom secureRandom = new SecureRandom();

    /** Result of a successful login: the app session token and the resolved user. */
    public record LoginResult(String token, User user) {}

    /** Holder returned to the controller so it can persist PKCE/state in the session. */
    public record AuthorizationRequest(String authorizationUrl, String state, String codeVerifier) {}

    /**
     * Thrown when the IDEM callback cannot be completed. Carries a short,
     * URL-safe {@code reason} code that the controller forwards to the frontend
     * (e.g. {@code token_exchange_http_401}, {@code no_email_claim}) so failures
     * are diagnosable from the browser URL and the logs.
     */
    public static class IdemLoginException extends RuntimeException {
        private final String reason;
        public IdemLoginException(String reason, String message) {
            super(message);
            this.reason = reason;
        }
        public String getReason() { return reason; }
    }

    private String authorizeEndpoint() {
        return stripTrailingSlash(issuerUri) + "/protocol/openid-connect/auth";
    }

    private String tokenEndpoint() {
        return stripTrailingSlash(issuerUri) + "/protocol/openid-connect/token";
    }

    private static String stripTrailingSlash(String s) {
        return (s != null && s.endsWith("/")) ? s.substring(0, s.length() - 1) : s;
    }

    /** Build the RH-SSO authorize URL with a fresh PKCE challenge + state. */
    public AuthorizationRequest buildAuthorizationRequest() {
        String state        = randomUrlSafe(32);
        String codeVerifier = randomUrlSafe(64);
        String codeChallenge = pkceChallenge(codeVerifier);

        String url = authorizeEndpoint()
                + "?response_type=code"
                + "&client_id="     + enc(clientId)
                + "&redirect_uri="  + enc(redirectUri)
                + "&scope="         + enc(scope)
                + "&state="         + enc(state)
                + "&code_challenge="        + enc(codeChallenge)
                + "&code_challenge_method=S256";

        return new AuthorizationRequest(url, state, codeVerifier);
    }

    /**
     * Exchange the authorization code for tokens and resolve the local user.
     *
     * @param code          authorization code returned by RH-SSO
     * @param codeVerifier  PKCE verifier stored in the session during step 1
     */
    @Transactional
    public LoginResult handleCallback(String code, String codeVerifier) throws Exception {
        String body = "grant_type=authorization_code"
                + "&code="          + enc(code)
                + "&client_id="     + enc(clientId)
                + "&redirect_uri="  + enc(redirectUri)
                + "&code_verifier=" + enc(codeVerifier);

        HttpRequest tokenReq = HttpRequest.newBuilder()
                .uri(URI.create(tokenEndpoint()))
                .timeout(Duration.ofSeconds(15))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<String> resp;
        try {
            resp = httpClient.send(tokenReq, HttpResponse.BodyHandlers.ofString());
        } catch (Exception ex) {
            // Network-level failure reaching Keycloak from THIS server (egress/proxy/DNS).
            log.error("IDEM token exchange could not reach Keycloak at {} — {}",
                    tokenEndpoint(), ex.toString());
            throw new IdemLoginException("keycloak_unreachable",
                    "Could not reach IDEM token endpoint: " + ex.getMessage());
        }
        if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
            log.warn("IDEM token exchange failed: HTTP {} — {}", resp.statusCode(), resp.body());
            throw new IdemLoginException("token_exchange_http_" + resp.statusCode(),
                    "IDEM token exchange failed (HTTP " + resp.statusCode() + "): " + resp.body());
        }

        JsonNode tokenResponse = objectMapper.readTree(resp.body());
        // Prefer the ID token for identity claims; fall back to access token.
        String idToken = tokenResponse.path("id_token").asText(null);
        String claimSource = (idToken != null && !idToken.isBlank())
                ? idToken
                : tokenResponse.path("access_token").asText(null);
        if (claimSource == null || claimSource.isBlank()) {
            throw new IdemLoginException("no_token_in_response",
                    "IDEM response did not contain an id_token or access_token");
        }

        JsonNode claims = decodeJwtPayload(claimSource);
        User user = provisionUser(claims);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String tenantId = user.getTenantId() != null ? user.getTenantId().toString() : null;
        String appToken = jwtUtil.generateToken(userDetails, tenantId);

        return new LoginResult(appToken, user);
    }

    /** Find-or-create a local user from the RH-SSO token claims. */
    private User provisionUser(JsonNode claims) {
        String email = firstNonBlank(
                claims.path("email").asText(null),
                claims.path("preferred_username").asText(null),
                claims.path("upn").asText(null),
                claims.path("sub").asText(null));
        if (email == null || email.isBlank()) {
            // Surface which claims WERE present so the mapping can be fixed in Keycloak.
            StringBuilder keys = new StringBuilder();
            claims.fieldNames().forEachRemaining(k -> keys.append(k).append(','));
            log.error("IDEM token contained no email/preferred_username/upn/sub. Claims present: [{}]", keys);
            throw new IdemLoginException("no_email_claim",
                    "IDEM token did not contain an email/preferred_username claim. "
                    + "Claims present: [" + keys + "]");
        }
        String fullName = firstNonBlank(
                claims.path("name").asText(null),
                (claims.path("given_name").asText("") + " " + claims.path("family_name").asText("")).trim(),
                email);

        UserRole role = resolveRole(claims);

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = User.builder()
                    // User ID (username) is always the corporate domain email.
                    .username(email)
                    .email(email)
                    .fullName(fullName)
                    // SSO users have no local password — store an unusable random hash.
                    .passwordHash(passwordEncoder.encode("SSO-" + UUID.randomUUID()))
                    .role(role)
                    .tenantId(UUID.fromString(defaultTenantId))
                    .active(true)
                    .build();
            user = userRepository.save(user);
            log.info("Provisioned new IDEM SSO user '{}' with role {}", email, role);
        } else {
            // Keep profile fresh on each login; do NOT downgrade an existing role.
            // Ensure the User ID stays equal to the domain email.
            if (!email.equals(user.getUsername())) {
                user.setUsername(email);
            }
            if (fullName != null && !fullName.isBlank()) {
                user.setFullName(fullName);
            }
            if (Boolean.FALSE.equals(user.getActive())) {
                user.setActive(true);
            }
            if (user.getTenantId() == null) {
                user.setTenantId(UUID.fromString(defaultTenantId));
            }
            user = userRepository.save(user);
        }
        return user;
    }

    /** Map a Keycloak realm role to a local {@link UserRole}, else use the default. */
    private UserRole resolveRole(JsonNode claims) {
        JsonNode realmRoles = claims.path("realm_access").path("roles");
        if (realmRoles.isArray()) {
            for (JsonNode r : realmRoles) {
                String candidate = r.asText("").trim().toUpperCase();
                for (UserRole role : UserRole.values()) {
                    if (role.name().equals(candidate)) {
                        return role;
                    }
                }
            }
        }
        try {
            return UserRole.valueOf(defaultRole.trim().toUpperCase());
        } catch (Exception e) {
            return UserRole.TESTER;
        }
    }

    // ── PKCE / JWT helpers ────────────────────────────────────────────────────

    private JsonNode decodeJwtPayload(String jwt) throws Exception {
        String[] parts = jwt.split("\\.");
        if (parts.length < 2) {
            throw new IllegalStateException("Malformed JWT from IDEM");
        }
        byte[] payload = Base64.getUrlDecoder().decode(parts[1]);
        return objectMapper.readTree(new String(payload, StandardCharsets.UTF_8));
    }

    private String pkceChallenge(String verifier) {
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] digest = sha256.digest(verifier.getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to compute PKCE challenge", e);
        }
    }

    private String randomUrlSafe(int bytes) {
        byte[] buf = new byte[bytes];
        secureRandom.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }

    private static String enc(String v) {
        return URLEncoder.encode(v == null ? "" : v, StandardCharsets.UTF_8);
    }

    private static String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }
}
