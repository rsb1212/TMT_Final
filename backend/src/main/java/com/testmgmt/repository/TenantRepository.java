package com.testmgmt.repository;

import com.testmgmt.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    
    Optional<Tenant> findByCode(String code);
    
    Optional<Tenant> findByCodeAndActiveTrue(String code);
    
    boolean existsByCode(String code);
}
