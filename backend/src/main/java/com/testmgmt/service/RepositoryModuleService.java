package com.testmgmt.service;

import com.testmgmt.entity.RepositoryModule;
import com.testmgmt.entity.RepositoryNode;
import com.testmgmt.entity.RepositoryNodeDocument;
import com.testmgmt.entity.Project;
import com.testmgmt.entity.User;
import com.testmgmt.repository.RepositoryModuleRepository;
import com.testmgmt.repository.RepositoryNodeRepository;
import com.testmgmt.repository.RepositoryNodeDocumentRepository;
import com.testmgmt.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RepositoryModuleService {

    private final RepositoryModuleRepository moduleRepository;
    private final RepositoryNodeRepository nodeRepository;
    private final RepositoryNodeDocumentRepository documentRepository;
    private final ProjectRepository projectRepository;

    private static final String UPLOAD_DIR = "./uploads/repository/";

    // ==================== MODULE OPERATIONS ====================

    public List<RepositoryModule> getAllModules() {
        return moduleRepository.findByActiveTrueOrderBySortOrderAscNameAsc();
    }

    public Optional<RepositoryModule> getModuleById(UUID id) {
        return moduleRepository.findById(id);
    }

    public RepositoryModule createModule(String name, String description, String icon, String color) {
        RepositoryModule module = RepositoryModule.builder()
                .name(name)
                .description(description)
                .icon(icon)
                .color(color)
                .sortOrder(moduleRepository.findAll().size())
                .active(true)
                .build();
        return moduleRepository.save(module);
    }

    public RepositoryModule updateModule(UUID id, String name, String description, String icon, String color) {
        RepositoryModule module = moduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Module not found"));
        module.setName(name);
        module.setDescription(description);
        module.setIcon(icon);
        module.setColor(color);
        return moduleRepository.save(module);
    }

    public void deleteModule(UUID id) {
        RepositoryModule module = moduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Module not found"));
        module.setActive(false);
        moduleRepository.save(module);
    }

    // ==================== NODE OPERATIONS ====================

    public List<RepositoryNode> getRootNodes(UUID moduleId) {
        RepositoryModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found"));
        return nodeRepository.findByRepositoryModuleAndParentNodeIsNullAndIsActiveTrueOrderBySortOrderAscNameAsc(module);
    }

    public List<RepositoryNode> getChildNodes(UUID parentId) {
        RepositoryNode parent = nodeRepository.findById(parentId)
                .orElseThrow(() -> new RuntimeException("Node not found"));
        return nodeRepository.findByParentNodeAndIsActiveTrueOrderBySortOrderAscNameAsc(parent);
    }

    public RepositoryNode createNode(UUID moduleId, UUID parentId, String name, String description, 
                                      String icon, String nodeType, boolean allowAddNew) {
        RepositoryModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found"));

        RepositoryNode parent = null;
        int depth = 0;
        String path = name;

        if (parentId != null) {
            parent = nodeRepository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("Parent node not found"));
            depth = parent.getDepth() + 1;
            path = parent.getPath() + "/" + name;
        }

        int sortOrder = (int) (parent != null 
                ? nodeRepository.countByParentNodeAndIsActiveTrue(parent)
                : nodeRepository.findByRepositoryModuleAndParentNodeIsNullAndIsActiveTrueOrderBySortOrderAscNameAsc(module).size());

        RepositoryNode node = RepositoryNode.builder()
                .name(name)
                .description(description)
                .icon(icon)
                .nodeType(nodeType != null ? RepositoryNode.NodeType.valueOf(nodeType) : RepositoryNode.NodeType.FOLDER)
                .path(path)
                .depth(depth)
                .sortOrder(sortOrder)
                .allowAddNew(allowAddNew)
                .isActive(true)
                .repositoryModule(module)
                .parentNode(parent)
                .build();

        return nodeRepository.save(node);
    }

    public RepositoryNode updateNode(UUID nodeId, String name, String description, String icon, boolean allowAddNew) {
        RepositoryNode node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("Node not found"));
        node.setName(name);
        node.setDescription(description);
        node.setIcon(icon);
        node.setAllowAddNew(allowAddNew);
        return nodeRepository.save(node);
    }

    public void deleteNode(UUID nodeId) {
        RepositoryNode node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("Node not found"));
        node.setIsActive(false);
        nodeRepository.save(node);
    }

    // ==================== DOCUMENT OPERATIONS ====================

    public List<RepositoryNodeDocument> getDocuments(UUID nodeId) {
        RepositoryNode node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("Node not found"));
        return documentRepository.findActiveByNode(node);
    }

    public RepositoryNodeDocument uploadDocument(UUID nodeId, UUID projectId, MultipartFile file, 
                                                  String description, User uploadedBy) throws IOException {
        RepositoryNode node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("Node not found"));

        Project project = null;
        if (projectId != null) {
            project = projectRepository.findById(projectId).orElse(null);
        }

        // Create upload directory
        Path uploadPath = Paths.get(UPLOAD_DIR, node.getRepositoryModule().getName(), node.getPath());
        Files.createDirectories(uploadPath);

        // Generate unique filename
        String originalName = file.getOriginalFilename();
        String fileName = UUID.randomUUID() + "_" + originalName;
        Path filePath = uploadPath.resolve(fileName);

        // Save file
        Files.copy(file.getInputStream(), filePath);

        // Create document record
        RepositoryNodeDocument document = RepositoryNodeDocument.builder()
                .fileName(fileName)
                .originalName(originalName)
                .filePath(filePath.toString())
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .version(1)
                .description(description)
                .status("ACTIVE")
                .uploadedAt(java.time.Instant.now())
                .repositoryNode(node)
                .project(project)
                .uploadedBy(uploadedBy)
                .build();

        return documentRepository.save(document);
    }

    public void archiveDocument(UUID documentId) {
        RepositoryNodeDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        document.setStatus("ARCHIVED");
        documentRepository.save(document);
    }

    public void deleteDocument(UUID documentId) {
        RepositoryNodeDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        document.setStatus("DELETED");
        documentRepository.save(document);
    }

    // ==================== MODULE TREE ====================

    public Map<String, Object> getModuleTree() {
        List<RepositoryModule> modules = getAllModules();
        List<Map<String, Object>> moduleList = new ArrayList<>();

        for (RepositoryModule module : modules) {
            Map<String, Object> moduleMap = new HashMap<>();
            moduleMap.put("id", module.getId());
            moduleMap.put("name", module.getName());
            moduleMap.put("description", module.getDescription());
            moduleMap.put("icon", module.getIcon());
            moduleMap.put("color", module.getColor());
            moduleMap.put("children", buildNodeTree(module));
            moduleList.add(moduleMap);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("modules", moduleList);
        return result;
    }

    private List<Map<String, Object>> buildNodeTree(RepositoryModule module) {
        List<RepositoryNode> rootNodes = nodeRepository
                .findByRepositoryModuleAndParentNodeIsNullAndIsActiveTrueOrderBySortOrderAscNameAsc(module);
        return buildNodeList(rootNodes);
    }

    private List<Map<String, Object>> buildNodeList(List<RepositoryNode> nodes) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (RepositoryNode node : nodes) {
            Map<String, Object> nodeMap = new HashMap<>();
            nodeMap.put("id", node.getId());
            nodeMap.put("name", node.getName());
            nodeMap.put("description", node.getDescription());
            nodeMap.put("icon", node.getIcon());
            nodeMap.put("nodeType", node.getNodeType());
            nodeMap.put("path", node.getPath());
            nodeMap.put("depth", node.getDepth());
            nodeMap.put("allowAddNew", node.getAllowAddNew());
            nodeMap.put("documentCount", documentRepository.countByNode(node));

            List<RepositoryNode> children = nodeRepository
                    .findByParentNodeAndIsActiveTrueOrderBySortOrderAscNameAsc(node);
            if (!children.isEmpty()) {
                nodeMap.put("children", buildNodeList(children));
            }

            result.add(nodeMap);
        }
        return result;
    }

    // ==================== SEED DEFAULT MODULES ====================

    public void seedDefaultModules() {
        if (moduleRepository.count() > 0) {
            log.info("Repository modules already exist, skipping seed");
            return;
        }

        log.info("Seeding default repository modules...");

        // Create AGILIC module
        RepositoryModule agilic = createModule("AGILIC", "Agilic Insurance Platform", "database", "#3B82F6");
        
        // Create AGILIC hierarchy as per the design
        createAgilicHierarchy(agilic);

        // Create OPUS module
        RepositoryModule opus = createModule("OPUS", "Opus Platform", "server", "#10B981");
        
        // Create Data Migration module
        RepositoryModule dataMigration = createModule("Data Migration", "Data Migration Projects", "refresh-cw", "#F59E0B");
        
        // Create Group Policy module
        RepositoryModule groupPolicy = createModule("Group Policy", "Group Policy Documents", "shield", "#8B5CF6");

        log.info("Default repository modules seeded successfully");
    }

    private void createAgilicHierarchy(RepositoryModule module) {
        // Product Name (first level)
        RepositoryNode productName1 = createNode(module.getId(), null, "Product Name", null, "folder", "FOLDER", true);
        
        // Term Products
        RepositoryNode termProducts = createNode(module.getId(), null, "Term Products", null, "folder", "FOLDER", true);
        
        // Product Name with sub-categories
        RepositoryNode productName2 = createNode(module.getId(), null, "Product Name", null, "folder", "FOLDER", true);
        
        // NB & UW under Product Name 2
        RepositoryNode nbUw = createNode(module.getId(), productName2.getId(), "NB & UW", null, "folder", "FOLDER", false);
        createNode(module.getId(), nbUw.getId(), "Module 1", null, "file", "DOCUMENT_CONTAINER", false);
        createNode(module.getId(), nbUw.getId(), "Module 2", null, "file", "DOCUMENT_CONTAINER", false);
        
        // CRT under Product Name 2
        RepositoryNode crt = createNode(module.getId(), productName2.getId(), "CRT", null, "folder", "FOLDER", false);
        createNode(module.getId(), crt.getId(), "Module 1", null, "file", "DOCUMENT_CONTAINER", false);
        createNode(module.getId(), crt.getId(), "Module 2", null, "file", "DOCUMENT_CONTAINER", false);
        
        // Other categories under Product Name 2
        createNode(module.getId(), productName2.getId(), "Commission", null, "file", "DOCUMENT_CONTAINER", false);
        createNode(module.getId(), productName2.getId(), "Claims", null, "file", "DOCUMENT_CONTAINER", false);
        createNode(module.getId(), productName2.getId(), "Taxation", null, "file", "DOCUMENT_CONTAINER", false);
        createNode(module.getId(), productName2.getId(), "Policy Servicing", null, "file", "DOCUMENT_CONTAINER", false);
        
        // Endowment Products
        createNode(module.getId(), null, "Endowment Products", null, "folder", "FOLDER", true);
        
        // Annuity
        createNode(module.getId(), null, "Annuity", null, "folder", "FOLDER", true);
        
        // PD Calls
        RepositoryNode pdCalls = createNode(module.getId(), null, "PD Calls", null, "folder", "FOLDER", true);
        createNode(module.getId(), pdCalls.getId(), "Call Number", null, "file", "DOCUMENT_CONTAINER", false);
        
        // CR Calls
        RepositoryNode crCalls = createNode(module.getId(), null, "CR Calls", null, "folder", "FOLDER", true);
        createNode(module.getId(), crCalls.getId(), "Call Number", null, "file", "DOCUMENT_CONTAINER", false);
    }

    // ==================== CONFLUENCE PAGE OPERATIONS ====================

    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    public Map<String, Object> getPage(UUID nodeId, String username) {
        RepositoryNode node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("Node not found"));

        Path pagesDir = Paths.get(UPLOAD_DIR, "pages");
        Path pageFile = pagesDir.resolve(nodeId.toString() + ".json");

        if (Files.exists(pageFile)) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> pageData = objectMapper.readValue(pageFile.toFile(), Map.class);
                pageData.put("isStarred", getUserStars(username).contains(nodeId.toString()));
                return pageData;
            } catch (Exception e) {
                log.error("Failed to read page file for node {}", nodeId, e);
            }
        }

        // Return default initial Confluence template page if not created yet
        Map<String, Object> defaultPage = new HashMap<>();
        defaultPage.put("nodeId", nodeId.toString());
        defaultPage.put("title", node.getName());
        defaultPage.put("description", node.getDescription() != null ? node.getDescription() : "");
        defaultPage.put("tags", List.of("Documentation", "Overview"));
        defaultPage.put("version", 1);
        defaultPage.put("lastModifiedBy", username != null ? username : "System");
        defaultPage.put("lastModifiedAt", java.time.Instant.now().toString());
        defaultPage.put("isStarred", getUserStars(username).contains(nodeId.toString()));

        String spaceName = node.getRepositoryModule() != null ? node.getRepositoryModule().getName() : "Repository";
        String initialContent = "# " + node.getName() + "\n\n"
                + "> ℹ️ **About this Page**  \n"
                + "> This page is part of the **" + spaceName + "** space documentation in Test Genii.\n\n"
                + "## 📋 Overview\n"
                + (node.getDescription() != null && !node.getDescription().isBlank() ? node.getDescription() + "\n\n" : "Add detailed documentation, technical specs, test scenarios, and guidelines for " + node.getName() + ".\n\n")
                + "## 🚀 Objectives & Scope\n"
                + "- [ ] Define core functionalities\n"
                + "- [ ] Review requirement coverage\n"
                + "- [ ] Execute smoke and regression test suites\n\n"
                + "## 💡 Key Highlights\n"
                + "| Item | Status | Priority | Notes |\n"
                + "| :--- | :--- | :--- | :--- |\n"
                + "| Integration Testing | In Progress | High | Verify API payloads |\n"
                + "| Regression Pack | Planned | Medium | Run automated checks |\n\n"
                + "## 📝 Important Notes\n"
                + "> 💡 **Tip:** Use the **Edit** button above to modify this document or pick from predefined Confluence templates!\n";

        defaultPage.put("content", initialContent);
        return defaultPage;
    }

    public Map<String, Object> savePage(UUID nodeId, Map<String, Object> requestData, String username) {
        RepositoryNode node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("Node not found"));

        try {
            Path pagesDir = Paths.get(UPLOAD_DIR, "pages");
            if (!Files.exists(pagesDir)) {
                Files.createDirectories(pagesDir);
            }

            Path pageFile = pagesDir.resolve(nodeId.toString() + ".json");
            int version = 1;

            if (Files.exists(pageFile)) {
                try {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> existing = objectMapper.readValue(pageFile.toFile(), Map.class);
                    Object verObj = existing.get("version");
                    if (verObj instanceof Number) {
                        version = ((Number) verObj).intValue() + 1;
                    }
                } catch (Exception ignored) {}
            }

            Map<String, Object> pageData = new HashMap<>(requestData);
            pageData.put("nodeId", nodeId.toString());
            if (!pageData.containsKey("title") || pageData.get("title") == null) {
                pageData.put("title", node.getName());
            } else {
                // Update node name if page title was edited
                String newTitle = pageData.get("title").toString();
                if (!newTitle.isBlank() && !newTitle.equals(node.getName())) {
                    node.setName(newTitle);
                    nodeRepository.save(node);
                }
            }
            pageData.put("version", version);
            pageData.put("lastModifiedBy", username != null ? username : "System");
            pageData.put("lastModifiedAt", java.time.Instant.now().toString());

            // Save active page
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(pageFile.toFile(), pageData);

            // Save version snapshot
            Path versionsDir = pagesDir.resolve(nodeId.toString() + "_versions");
            if (!Files.exists(versionsDir)) {
                Files.createDirectories(versionsDir);
            }
            Path versionFile = versionsDir.resolve("v" + version + ".json");
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(versionFile.toFile(), pageData);

            // Update versions index
            Path indexFile = versionsDir.resolve("index.json");
            List<Map<String, Object>> versionList = new ArrayList<>();
            if (Files.exists(indexFile)) {
                try {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> existingList = objectMapper.readValue(indexFile.toFile(), List.class);
                    versionList.addAll(existingList);
                } catch (Exception ignored) {}
            }

            Map<String, Object> vMeta = new HashMap<>();
            vMeta.put("version", version);
            vMeta.put("savedAt", pageData.get("lastModifiedAt"));
            vMeta.put("savedBy", pageData.get("lastModifiedBy"));
            vMeta.put("title", pageData.get("title"));
            versionList.add(0, vMeta); // Latest first
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(indexFile.toFile(), versionList);

            pageData.put("isStarred", getUserStars(username).contains(nodeId.toString()));
            return pageData;
        } catch (IOException e) {
            log.error("Failed to save page for node {}", nodeId, e);
            throw new RuntimeException("Failed to save page: " + e.getMessage());
        }
    }

    public List<Map<String, Object>> getPageVersions(UUID nodeId) {
        Path indexFile = Paths.get(UPLOAD_DIR, "pages", nodeId.toString() + "_versions", "index.json");
        if (Files.exists(indexFile)) {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> list = objectMapper.readValue(indexFile.toFile(), List.class);
                return list;
            } catch (Exception e) {
                log.error("Failed to read versions for node {}", nodeId, e);
            }
        }
        return Collections.emptyList();
    }

    public Map<String, Object> restorePageVersion(UUID nodeId, int version, String username) {
        Path versionFile = Paths.get(UPLOAD_DIR, "pages", nodeId.toString() + "_versions", "v" + version + ".json");
        if (!Files.exists(versionFile)) {
            throw new RuntimeException("Version v" + version + " not found");
        }
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> snapshot = objectMapper.readValue(versionFile.toFile(), Map.class);
            return savePage(nodeId, snapshot, username);
        } catch (IOException e) {
            throw new RuntimeException("Failed to restore version: " + e.getMessage());
        }
    }

    // ==================== COMMENTS ====================

    public List<Map<String, Object>> getPageComments(UUID nodeId) {
        Path commentsFile = Paths.get(UPLOAD_DIR, "pages", nodeId.toString() + "_comments.json");
        if (Files.exists(commentsFile)) {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> comments = objectMapper.readValue(commentsFile.toFile(), List.class);
                return comments;
            } catch (Exception e) {
                log.error("Failed to read comments for node {}", nodeId, e);
            }
        }
        return new ArrayList<>();
    }

    public Map<String, Object> addPageComment(UUID nodeId, String text, String username, String role) {
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("Comment text cannot be empty");
        }

        List<Map<String, Object>> comments = getPageComments(nodeId);
        Map<String, Object> newComment = new HashMap<>();
        newComment.put("id", UUID.randomUUID().toString());
        newComment.put("nodeId", nodeId.toString());
        newComment.put("text", text.trim());
        newComment.put("author", username != null ? username : "Anonymous");
        newComment.put("authorRole", role != null ? role : "TESTER");
        newComment.put("createdAt", java.time.Instant.now().toString());

        comments.add(newComment);

        try {
            Path pagesDir = Paths.get(UPLOAD_DIR, "pages");
            if (!Files.exists(pagesDir)) {
                Files.createDirectories(pagesDir);
            }
            Path commentsFile = pagesDir.resolve(nodeId.toString() + "_comments.json");
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(commentsFile.toFile(), comments);
        } catch (IOException e) {
            log.error("Failed to save comments for node {}", nodeId, e);
            throw new RuntimeException("Failed to save comment: " + e.getMessage());
        }

        return newComment;
    }

    // ==================== USER STARS ====================

    public Set<String> getUserStars(String username) {
        String safeUser = (username != null ? username : "default").replaceAll("[^a-zA-Z0-9_.-]", "_");
        Path starFile = Paths.get(UPLOAD_DIR, "pages", "stars_" + safeUser + ".json");
        if (Files.exists(starFile)) {
            try {
                @SuppressWarnings("unchecked")
                List<String> list = objectMapper.readValue(starFile.toFile(), List.class);
                return new HashSet<>(list);
            } catch (Exception ignored) {}
        }
        return new HashSet<>();
    }

    public boolean toggleStar(UUID nodeId, String username) {
        String safeUser = (username != null ? username : "default").replaceAll("[^a-zA-Z0-9_.-]", "_");
        Set<String> stars = getUserStars(username);
        String idStr = nodeId.toString();
        boolean nowStarred;
        if (stars.contains(idStr)) {
            stars.remove(idStr);
            nowStarred = false;
        } else {
            stars.add(idStr);
            nowStarred = true;
        }

        try {
            Path pagesDir = Paths.get(UPLOAD_DIR, "pages");
            if (!Files.exists(pagesDir)) {
                Files.createDirectories(pagesDir);
            }
            Path starFile = pagesDir.resolve("stars_" + safeUser + ".json");
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(starFile.toFile(), new ArrayList<>(stars));
        } catch (IOException e) {
            log.error("Failed to save stars for user {}", username, e);
        }

        return nowStarred;
    }
}
