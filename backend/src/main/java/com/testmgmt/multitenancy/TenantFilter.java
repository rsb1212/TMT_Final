package com.testmgmt.multitenancy;

import com.testmgmt.security.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter to extract tenant information from request and set in TenantContext.
 * Tenant can be specified via:
 * 1. X-Tenant-ID header
 * 2. JWT token claim
 * 3. Subdomain (optional)
 * 
 * ADMIN users have access to all tenants and can switch between them.
 */
@Component
@Order(1)
public class TenantFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String tenantId = extractTenantId(request);
            boolean isAdmin = checkIfAdmin(request);
            
            if (tenantId != null) {
                TenantContext.setCurrentTenant(tenantId);
            }
            
            // Set admin flag - ADMIN users can access all tenant data
            TenantContext.setIsAdmin(isAdmin);
            
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private String extractTenantId(HttpServletRequest request) {
        // 1. Check X-Tenant-ID header first (allows ADMIN to switch tenants)
        String tenantId = request.getHeader("X-Tenant-ID");
        if (tenantId != null && !tenantId.isEmpty()) {
            return tenantId;
        }

        // 2. Extract from JWT token
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                tenantId = jwtUtil.extractTenantId(token);
                if (tenantId != null) {
                    return tenantId;
                }
            } catch (Exception e) {
                // Token parsing failed, continue without tenant
            }
        }

        return null;
    }

    /**
     * Check if the current user is an ADMIN by examining the JWT token.
     */
    private boolean checkIfAdmin(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String role = jwtUtil.extractRole(token);
                return "ADMIN".equals(role);
            } catch (Exception e) {
                // Token parsing failed
            }
        }
        return false;
    }
}
