package com.testmgmt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "repository_nodes",
        indexes = {
            @Index(name = "idx_repo_node_module", columnList = "repository_module_id"),
            @Index(name = "idx_repo_node_parent", columnList = "parent_node_id"),
            @Index(name = "idx_repo_node_type", columnList = "node_type"),
            @Index(name = "idx_repo_node_sort", columnList = "sort_order")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RepositoryNode extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repository_module_id", nullable = false)
    private RepositoryModule repositoryModule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_node_id")
    private RepositoryNode parentNode;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "icon", length = 50)
    @Builder.Default
    private String icon = "folder";

    @Enumerated(EnumType.STRING)
    @Column(name = "node_type", nullable = false, length = 30)
    @Builder.Default
    private NodeType nodeType = NodeType.FOLDER;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "allow_add_new")
    @Builder.Default
    private Boolean allowAddNew = true;

    @Column(name = "path", length = 500)
    private String path;

    @Column(name = "depth")
    @Builder.Default
    private Integer depth = 0;

    @OneToMany(mappedBy = "parentNode", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<RepositoryNode> children = new ArrayList<>();

    @OneToMany(mappedBy = "repositoryNode", cascade = CascadeType.ALL)
    @Builder.Default
    private List<RepositoryNodeDocument> documents = new ArrayList<>();

    public enum NodeType {
        FOLDER,
        DOCUMENT_CONTAINER
    }

    @PrePersist
    @PreUpdate
    protected void updatePath() {
        if (parentNode != null) {
            this.path = parentNode.getPath() + "/" + generateSlug(name);
            this.depth = parentNode.getDepth() + 1;
        } else {
            this.path = repositoryModule != null 
                ? generateSlug(repositoryModule.getName()) + "/" + generateSlug(name)
                : generateSlug(name);
            this.depth = 0;
        }
    }

    private String generateSlug(String text) {
        if (text == null) return "";
        return text.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .trim();
    }
}
