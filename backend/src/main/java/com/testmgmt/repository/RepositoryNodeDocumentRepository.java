package com.testmgmt.repository;

import com.testmgmt.entity.Project;
import com.testmgmt.entity.RepositoryNode;
import com.testmgmt.entity.RepositoryNodeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RepositoryNodeDocumentRepository extends JpaRepository<RepositoryNodeDocument, UUID> {

    /** Find documents by node */
    List<RepositoryNodeDocument> findByRepositoryNodeAndStatusOrderByUploadedAtDesc(RepositoryNode node, String status);

    /** Find documents by node (active only) */
    default List<RepositoryNodeDocument> findActiveByNode(RepositoryNode node) {
        return findByRepositoryNodeAndStatusOrderByUploadedAtDesc(node, "ACTIVE");
    }

    /** Find documents by project and node */
    List<RepositoryNodeDocument> findByProjectAndRepositoryNodeAndStatusOrderByUploadedAtDesc(
            Project project, RepositoryNode node, String status);

    /** Count documents in a node */
    @Query("SELECT COUNT(d) FROM RepositoryNodeDocument d WHERE d.repositoryNode = :node AND d.status = 'ACTIVE'")
    long countByNode(@Param("node") RepositoryNode node);

    /** Find documents by project across all nodes */
    List<RepositoryNodeDocument> findByProjectAndStatusOrderByUploadedAtDesc(Project project, String status);
}
