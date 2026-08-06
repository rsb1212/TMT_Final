package com.testmgmt.repository;

import com.testmgmt.entity.RepositoryModule;
import com.testmgmt.entity.RepositoryNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RepositoryNodeRepository extends JpaRepository<RepositoryNode, UUID> {

    /** Find root nodes (no parent) for a module */
    List<RepositoryNode> findByRepositoryModuleAndParentNodeIsNullAndIsActiveTrueOrderBySortOrderAscNameAsc(RepositoryModule module);

    /** Find children of a node */
    List<RepositoryNode> findByParentNodeAndIsActiveTrueOrderBySortOrderAscNameAsc(RepositoryNode parent);

    /** Find all nodes in a module */
    List<RepositoryNode> findByRepositoryModuleAndIsActiveTrueOrderByPathAsc(RepositoryModule module);

    /** Find node by path */
    @Query("SELECT n FROM RepositoryNode n WHERE n.repositoryModule = :module AND n.path = :path AND n.isActive = true")
    RepositoryNode findByRepositoryModuleAndPath(@Param("module") RepositoryModule module, @Param("path") String path);

    /** Count children of a node */
    long countByParentNodeAndIsActiveTrue(RepositoryNode parent);
}
