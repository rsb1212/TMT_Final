package com.testmgmt.multitenancy;

/**
 * Thread-local context to hold current tenant information.
 * This allows automatic filtering of data by tenant throughout the application.
 * 
 * ADMIN users have isAdmin=true which allows them to access all tenant data.
 */
public class TenantContext {

    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> IS_ADMIN = new ThreadLocal<>();

    public static void setCurrentTenant(String tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static String getCurrentTenant() {
        return CURRENT_TENANT.get();
    }

    public static void setIsAdmin(boolean isAdmin) {
        IS_ADMIN.set(isAdmin);
    }

    /**
     * Check if current user is an ADMIN with access to all tenants.
     */
    public static boolean isAdmin() {
        Boolean admin = IS_ADMIN.get();
        return admin != null && admin;
    }

    /**
     * Check if tenant filtering should be applied.
     * Returns false for ADMIN users (they can see all data).
     */
    public static boolean shouldFilterByTenant() {
        return !isAdmin() && getCurrentTenant() != null;
    }

    public static void clear() {
        CURRENT_TENANT.remove();
        IS_ADMIN.remove();
    }
}
