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
}
