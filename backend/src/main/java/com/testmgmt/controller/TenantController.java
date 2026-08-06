package com.testmgmt.controller;

import com.testmgmt.dto.response.ResponseDTOs.ApiResponse;
import com.testmgmt.dto.response.ResponseDTOs.TenantResponse;
import com.testmgmt.entity.Tenant;
import com.testmgmt.service.TenantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/tenants")
public class TenantController {

    @Autowired
    private TenantService tenantService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TenantResponse>>> list() {
        List<TenantResponse> tenants = tenantService.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(tenants));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TenantResponse>> get(@PathVariable UUID id) {
        return tenantService.findById(id)
                .map(t -> ResponseEntity.ok(ApiResponse.success(toResponse(t))))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TenantResponse>> create(@RequestBody Tenant tenant) {
        try {
            Tenant created = tenantService.create(tenant);
            return ResponseEntity.ok(ApiResponse.success(toResponse(created)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TenantResponse>> update(@PathVariable UUID id, @RequestBody Tenant updates) {
        try {
            Tenant updated = tenantService.update(id, updates);
            return ResponseEntity.ok(ApiResponse.success(toResponse(updated)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        tenantService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable UUID id) {
        try {
            tenantService.deactivate(id);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private TenantResponse toResponse(Tenant tenant) {
        return TenantResponse.builder()
                .id(tenant.getId())
                .code(tenant.getCode())
                .name(tenant.getName())
                .description(tenant.getDescription())
                .active(tenant.getActive())
                .settings(tenant.getSettings())
                .createdAt(tenant.getCreatedAt())
                .updatedAt(tenant.getUpdatedAt())
                .build();
    }
}
