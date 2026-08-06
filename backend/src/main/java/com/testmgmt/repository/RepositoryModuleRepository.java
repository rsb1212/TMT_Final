package com.testmgmt.repository;

import com.testmgmt.entity.RepositoryModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RepositoryModuleRepository extends JpaRepository<RepositoryModule, UUID> {

    List<RepositoryModule> findByActiveTrueOrderBySortOrderAscNameAsc();

    List<RepositoryModule> findAllByOrderBySortOrderAscNameAsc();

    Optional<RepositoryModule> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    long countByActiveTrue();
}
