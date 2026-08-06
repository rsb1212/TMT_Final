package com.testmgmt.repository;

import com.testmgmt.entity.RepoCategoryEntity;
import com.testmgmt.entity.RepositoryModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RepositoryCategoryRepository extends JpaRepository<RepoCategoryEntity, UUID> {

    /** Find all root categories (no parent) for a module */
    List<RepoCategoryEntity> findByModuleAndParentIsNullAndActiveTrueOrderBySortOrderAscNameAsc(RepositoryModule module);

    /** Find all categories for a module */
    List<RepoCategoryEntity> findByModuleAndActiveTrueOrderBySortOrderAscNameAsc(RepositoryModule module);

    /** Find child categories of a parent */
    List<RepoCategoryEntity> findByParentAndActiveTrueOrderBySortOrderAscNameAsc(RepoCategoryEntity parent);

    /** Find by module ID and name (case-insensitive) */
    Optional<RepoCategoryEntity> findByModuleIdAndNameIgnoreCase(UUID moduleId, String name);

    /** Check if category name exists in module */
    boolean existsByModuleAndNameIgnoreCase(RepositoryModule module, String name);

    /** Check if category name exists under a parent */
    boolean existsByParentAndNameIgnoreCase(RepoCategoryEntity parent, String name);

    /** Count categories in a module */
    long countByModuleAndActiveTrue(RepositoryModule module);

    /** Find category by full path */
    Optional<RepoCategoryEntity> findByFullPathIgnoreCase(String fullPath);

    /** Find all leaf categories (no children) for document upload */
    @Query("SELECT c FROM RepoCategoryEntity c WHERE c.module = :module AND c.active = true AND " +
           "NOT EXISTS (SELECT 1 FROM RepoCategoryEntity child WHERE child.parent = c AND child.active = true)")
    List<RepoCategoryEntity> findLeafCategoriesByModule(@Param("module") RepositoryModule module);

    /** Find categories by module ID with eager loading */
    @Query("SELECT DISTINCT c FROM RepoCategoryEntity c " +
           "LEFT JOIN FETCH c.children " +
           "WHERE c.module.id = :moduleId AND c.parent IS NULL AND c.active = true " +
           "ORDER BY c.sortOrder, c.name")
    List<RepoCategoryEntity> findRootCategoriesWithChildren(@Param("moduleId") UUID moduleId);
}
