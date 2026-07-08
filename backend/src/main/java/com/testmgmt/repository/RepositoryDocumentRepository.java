package com.testmgmt.repository;

import com.testmgmt.entity.Project;
import com.testmgmt.entity.RepositoryDocument;
import com.testmgmt.enums.RepositoryCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RepositoryDocumentRepository extends JpaRepository<RepositoryDocument, UUID> {
    List<RepositoryDocument> findByProjectOrderByUploadedAtDesc(Project project);
    List<RepositoryDocument> findByProjectAndCategoryOrderByUploadedAtDesc(Project project, RepositoryCategory category);
    List<RepositoryDocument> findByProjectAndStatusOrderByUploadedAtDesc(Project project, String status);
    long countByProjectAndStatus(Project project, String status);
}
