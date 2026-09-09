package com.testmgmt.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.testmgmt.dto.request.AuthDTOs.LoginRequest;
import com.testmgmt.dto.response.ResponseDTOs.ApiResponse;
import com.testmgmt.dto.response.ResponseDTOs.AuthResponse;
import com.testmgmt.dto.response.ResponseDTOs.UserResponse;
import com.testmgmt.security.IdemSsoService;
import com.testmgmt.security.IdemSsoService.AuthorizationRequest;
import com.testmgmt.security.IdemSsoService.LoginResult;
import com.testmgmt.service.AuthService;
import com.testmgmt.service.IdemAuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * IDEM / RH-SSO (Keycloak) OIDC login endpoints.
 *
 * <p>Replaces the local username/password JWT login. Browser flow:
 * <pre>
 *   GET /api/v1/auth/idem/login     → 302 redirect to RH-SSO authorize URL
 *   GET /api/v1/auth/idem/callback  → exchanges code, mints app JWT,
 *                                     302 redirects to the frontend with token+user
 * </pre>
 */
@RestController
@RequestMapping("/api/v1/auth/idem")
@RequiredArgsConstructor
public class IdemAuthController {

    private static final Logger log = LoggerFactory.getLogger(IdemAuthController.class);

    private final IdemSsoService idemSsoService;
    private final IdemAuthService idemAuthService;
    private final ObjectMapper   objectMapper = new ObjectMapper();

    @Value("${app.idem.enabled:true}")
    private boolean idemEnabled;

    @Value("${app.idem.post-login-redirect:http://localhost:3000/login}")
    private String postLoginRedirect;

    /**
     * Direct credential login — validates the User ID (domain email) + password
     * against the local database and returns a role-aware JWT.
     *
     * <p>Used by the frontend "Sign in with IDEM" form. On success the response
     * body contains the JWT plus the authenticated user (including their role),
     * so the SPA can route the session based on that role.
     */
    @PostMapping("/authenticate")
    public ResponseEntity<ApiResponse<AuthResponse>> authenticate(@Valid @RequestBody LoginRequest request) {
        AuthResponse auth = idemAuthService.authenticate(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", auth));
    }

    /** Step 1 — redirect the browser to the RH-SSO authorize endpoint. */
    @GetMapping("/login")
    public void login(HttpServletRequest request, HttpServletResponse response) throws Exception {
        if (!idemEnabled) {
            response.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE, "IDEM SSO is disabled");
            return;
        }
        AuthorizationRequest authRequest = idemSsoService.buildAuthorizationRequest();

        HttpSession session = request.getSession(true);
        session.setAttribute(IdemSsoService.SESSION_STATE, authRequest.state());
        session.setAttribute(IdemSsoService.SESSION_VERIFIER, authRequest.codeVerifier());

        response.sendRedirect(authRequest.authorizationUrl());
    }

    /** Step 2 — RH-SSO redirects back here with an authorization code. */
    @GetMapping("/callback")
    public void callback(@RequestParam(value = "code", required = false) String code,
                         @RequestParam(value = "state", required = false) String state,
                         @RequestParam(value = "error", required = false) String error,
                         @RequestParam(value = "error_description", required = false) String errorDescription,
                         HttpServletRequest request,
                         HttpServletResponse response) throws Exception {

        if (error != null) {
            log.warn("IDEM callback returned error '{}': {}", error, errorDescription);
            redirectToFrontendError(response, error);
            return;
        }

        HttpSession session = request.getSession(false);
        if (session == null) {
            log.warn("IDEM callback received with no active session");
            redirectToFrontendError(response, "invalid_session");
            return;
        }
        String expectedState = (String) session.getAttribute(IdemSsoService.SESSION_STATE);
        String codeVerifier  = (String) session.getAttribute(IdemSsoService.SESSION_VERIFIER);

        if (code == null || expectedState == null || codeVerifier == null || !expectedState.equals(state)) {
            log.warn("IDEM callback state/PKCE validation failed (missing code/session or state mismatch)");
            redirectToFrontendError(response, "invalid_session");
            return;
        }

        // One-time use — clear the stored PKCE material immediately.
        session.removeAttribute(IdemSsoService.SESSION_STATE);
        session.removeAttribute(IdemSsoService.SESSION_VERIFIER);

        try {
            LoginResult result = idemSsoService.handleCallback(code, codeVerifier);
            UserResponse userResponse = AuthService.toUserResponse(result.user());

            String userJson    = objectMapper.writeValueAsString(userResponse);
            String userB64     = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(userJson.getBytes(StandardCharsets.UTF_8));

            String redirect = postLoginRedirect
                    + (postLoginRedirect.contains("?") ? "&" : "?")
                    + "sso=success"
                    + "&token=" + enc(result.token())
                    + "&user="  + enc(userB64);
            response.sendRedirect(redirect);
        } catch (IdemSsoService.IdemLoginException e) {
            // Specific, diagnosable reason (e.g. token_exchange_http_401, no_email_claim).
            log.error("IDEM login failed [{}]: {}", e.getReason(), e.getMessage());
            redirectToFrontendError(response, e.getReason());
        } catch (Exception e) {
            log.error("IDEM login failed during token exchange/provisioning", e);
            redirectToFrontendError(response, "login_failed");
        }
    }

    private void redirectToFrontendError(HttpServletResponse response, String reason) throws Exception {
        String redirect = postLoginRedirect
                + (postLoginRedirect.contains("?") ? "&" : "?")
                + "sso=error&reason=" + enc(reason);
        response.sendRedirect(redirect);
    }

    private static String enc(String v) {
        return URLEncoder.encode(v == null ? "" : v, StandardCharsets.UTF_8);
    }
}
