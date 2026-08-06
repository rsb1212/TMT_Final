package com.testmgmt.service;

import com.testmgmt.entity.Tenant;
import com.testmgmt.repository.TenantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class TenantService {

    @Autowired
    private TenantRepository tenantRepository;

    public List<Tenant> findAll() {
        return tenantRepository.findAll();
    }

    public Optional<Tenant> findById(UUID id) {
        return tenantRepository.findById(id);
    }

    public Optional<Tenant> findByCode(String code) {
        return tenantRepository.findByCode(code);
    }

    public Tenant create(Tenant tenant) {
        if (tenantRepository.existsByCode(tenant.getCode())) {
            throw new IllegalArgumentException("Tenant code already exists: " + tenant.getCode());
        }
        return tenantRepository.save(tenant);
    }

    public Tenant update(UUID id, Tenant updates) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + id));
        
        if (updates.getName() != null) tenant.setName(updates.getName());
        if (updates.getDescription() != null) tenant.setDescription(updates.getDescription());
        if (updates.getSettings() != null) tenant.setSettings(updates.getSettings());
        if (updates.getActive() != null) tenant.setActive(updates.getActive());
        
        return tenantRepository.save(tenant);
    }

    public void delete(UUID id) {
        tenantRepository.deleteById(id);
    }

    public void deactivate(UUID id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + id));
        tenant.setActive(false);
        tenantRepository.save(tenant);
    }
}
