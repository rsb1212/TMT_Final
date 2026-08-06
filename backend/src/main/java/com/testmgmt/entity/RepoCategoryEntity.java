package com.testmgmt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a category within a Repository Module.
 * Supports hierarchical structure: Category → Subcategory → Sub-subcategory
 * Examples: Product, Project/NB, Project/PS, Project/Claims
 * 
 * Note: Named RepoCategoryEntity to avoid conflict with legacy RepositoryCategory enum.
 */
@Entity
@Table(name = "repository_categories",
        indexes = {
            @Index(name = "idx_repo_cat_module", columnList = "module_id"),
            @Index(name = "idx_repo_cat_parent", columnList = "parent_id"),
            @Index(name = "idx_repo_cat_active", columnList = "active")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RepoCategoryEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private RepositoryModule module;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private RepoCategoryEntity parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, name ASC")
    @Builder.Default
    private List<RepoCategoryEntity> children = new ArrayList<>();

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "display_name", nullable = false, length = 150)
    private String displayName;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "color", length = 20)
    private String color;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    /** Full path for display: "Module / Category / Subcategory" */
    @Column(name = "full_path", length = 500)
    private String fullPath;

    /** Depth level: 0 = root category, 1 = subcategory, 2 = sub-subcategory */
    @Column(name = "depth")
    @Builder.Default
    private Integer depth = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @PrePersist
    @PreUpdate
    protected void updateFullPath() {
        StringBuilder path = new StringBuilder();
        if (module != null) {
            path.append(module.getDisplayName());
        }
        if (parent != null) {
            path.append(" / ").append(parent.getDisplayName());
        }
        path.append(" / ").append(displayName);
        this.fullPath = path.toString();
        
        // Calculate depth
        int d = 0;
        RepoCategoryEntity p = parent;
        while (p != null) {
            d++;
            p = p.getParent();
        }
        this.depth = d;
    }
}
