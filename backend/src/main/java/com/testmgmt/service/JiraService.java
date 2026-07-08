package com.testmgmt.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.testmgmt.entity.Defect;
import com.testmgmt.repository.DefectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * JiraService — bidirectional sync between TestMgmt defects and JIRA issues.
 *
 * Flow:
 *   1. Tester raises defect in TestMgmt   → createJiraIssue()  → stores jiraIssueKey on Defect
 *   2. JIRA webhook fires on status change → handleWebhook()    → updates Defect.status
 */
@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings({"null"})
public class JiraService {

    private final DefectRepository defectRepository;
    private final ObjectMapper     objectMapper;
    private final RestTemplate     restTemplate;

    @Value("${jira.enabled:false}")      private boolean jiraEnabled;
    @Value("${jira.base-url:}")          private String  baseUrl;
    @Value("${jira.email:}")             private String  email;
    @Value("${jira.api-token:}")         private String  apiToken;
    @Value("${jira.project-key:}")       private String  projectKey;
    @Value("${jira.issue-type:Bug}")     private String  issueType;

    // ── Create JIRA issue from a TestMgmt defect ─────────────────────────────

    @Transactional
    public String createJiraIssue(UUID defectId) {
        if (!jiraEnabled) {
            log.info("JIRA integration disabled — skipping issue creation for defect {}", defectId);
            return null;
        }

        Defect defect = defectRepository.findById(defectId)
                .orElseThrow(() -> new RuntimeException("Defect not found: " + defectId));

        if (defect.getJiraIssueKey() != null) {
            log.info("Defect {} already linked to JIRA {}", defectId, defect.getJiraIssueKey());
            return defect.getJiraIssueKey();
        }

        try {
            // Build JIRA issue payload
            Map<String, Object> fields = new HashMap<>();
            fields.put("project",   Map.of("key", projectKey));
            fields.put("summary",   "[" + defect.getCode() + "] " + defect.getTitle());
            fields.put("issuetype", Map.of("name", issueType));
            fields.put("description", buildAdfDescription(defect));
            fields.put("priority",  Map.of("name", mapPriority(defect.getPriority())));
            fields.put("labels",    new String[]{"testmgmt", "auto-created"});

            Map<String, Object> body = Map.of("fields", fields);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, buildHeaders());
            ResponseEntity<String> response = restTemplate.postForEntity(
                    baseUrl + "/rest/api/3/issue", request, String.class);

            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                JsonNode json = objectMapper.readTree(response.getBody());
                String issueKey = json.get("key").asText();
                String issueId  = json.get("id").asText();

                // Store JIRA key on defect
                defect.setJiraIssueKey(issueKey);
                defect.setJiraIssueId(issueId);
                defectRepository.save(defect);

                log.info("Created JIRA issue {} for defect {}", issueKey, defect.getCode());
                return issueKey;
            } else {
                log.error("JIRA issue creation failed: {}", response.getStatusCode());
                return null;
            }

        } catch (Exception e) {
            log.error("Failed to create JIRA issue for defect {}: {}", defectId, e.getMessage());
            return null;
        }
    }

    // ── Update JIRA issue status (transition) ─────────────────────────────────

    public boolean transitionJiraIssue(String issueKey, String targetStatus) {
        if (!jiraEnabled || issueKey == null) return false;

        try {
            // Step 1: Get available transitions
            ResponseEntity<String> transResp = restTemplate.exchange(
                    baseUrl + "/rest/api/3/issue/" + issueKey + "/transitions",
                    HttpMethod.GET, new HttpEntity<>(buildHeaders()), String.class);

            if (transResp.getBody() == null) return false;

            JsonNode transNode = objectMapper.readTree(transResp.getBody());
            String transitionId = null;

            for (JsonNode t : transNode.get("transitions")) {
                String tName = t.get("name").asText().toLowerCase();
                if (tName.contains(targetStatus.toLowerCase())) {
                    transitionId = t.get("id").asText();
                    break;
                }
            }

            if (transitionId == null) {
                log.warn("No matching JIRA transition found for status '{}' on {}", targetStatus, issueKey);
                return false;
            }

            // Step 2: Execute transition
            Map<String, Object> payload = Map.of("transition", Map.of("id", transitionId));
            restTemplate.postForEntity(
                    baseUrl + "/rest/api/3/issue/" + issueKey + "/transitions",
                    new HttpEntity<>(payload, buildHeaders()), Void.class);

            log.info("Transitioned JIRA issue {} to '{}'", issueKey, targetStatus);
            return true;

        } catch (Exception e) {
            log.error("Failed to transition JIRA issue {}: {}", issueKey, e.getMessage());
            return false;
        }
    }

    // ── Add comment to JIRA issue ─────────────────────────────────────────────

    public void addComment(String issueKey, String comment) {
        if (!jiraEnabled || issueKey == null) return;
        try {
            Map<String, Object> body = Map.of("body", buildAdfText(comment));
            restTemplate.postForEntity(
                    baseUrl + "/rest/api/3/issue/" + issueKey + "/comment",
                    new HttpEntity<>(body, buildHeaders()), String.class);
        } catch (Exception e) {
            log.error("Failed to add JIRA comment on {}: {}", issueKey, e.getMessage());
        }
    }

    // ── Handle incoming JIRA webhook ──────────────────────────────────────────

    @Transactional
    public void handleWebhook(String payload) {
        try {
            JsonNode node        = objectMapper.readTree(payload);
            String   webhookEvent = node.path("webhookEvent").asText();
            JsonNode issue        = node.path("issue");
            String   issueKey     = issue.path("key").asText();
            String   jiraStatus   = issue.path("fields").path("status").path("name").asText();

            log.info("JIRA webhook: event={} issue={} status={}", webhookEvent, issueKey, jiraStatus);

            // Find defect linked to this JIRA key
            defectRepository.findByJiraIssueKey(issueKey).ifPresent(defect -> {
                com.testmgmt.enums.DefectStatus newStatus = mapJiraStatus(jiraStatus);
                if (newStatus != null && defect.getStatus() != newStatus) {
                    defect.setStatus(newStatus);
                    defectRepository.save(defect);
                    log.info("Synced defect {} status to {} from JIRA", defect.getCode(), newStatus);
                }
            });

        } catch (Exception e) {
            log.error("Failed to process JIRA webhook: {}", e.getMessage());
        }
    }

    // ── Get JIRA issue details ─────────────────────────────────────────────────

    public Map<String, Object> getIssue(String issueKey) {
        if (!jiraEnabled || issueKey == null) return Map.of();
        try {
            ResponseEntity<String> resp = restTemplate.exchange(
                    baseUrl + "/rest/api/3/issue/" + issueKey +
                    "?fields=summary,status,priority,assignee,description,comment",
                    HttpMethod.GET, new HttpEntity<>(buildHeaders()), String.class);

            if (resp.getBody() == null) return Map.of();
            JsonNode node = objectMapper.readTree(resp.getBody());
            JsonNode fields = node.get("fields");

            return Map.of(
                "key",         issueKey,
                "summary",     fields.path("summary").asText(),
                "status",      fields.path("status").path("name").asText(),
                "priority",    fields.path("priority").path("name").asText(),
                "assignee",    fields.path("assignee").path("displayName").asText("Unassigned"),
                "url",         baseUrl + "/browse/" + issueKey
            );
        } catch (Exception e) {
            log.error("Failed to fetch JIRA issue {}: {}", issueKey, e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private HttpHeaders buildHeaders() {
        String credentials = email + ":" + apiToken;
        String encoded = Base64.getEncoder()
                .encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + encoded);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Accept", MediaType.APPLICATION_JSON_VALUE);
        return headers;
    }

    /** JIRA requires description in Atlassian Document Format (ADF) */
    private Map<String, Object> buildAdfDescription(Defect defect) {
        return Map.of(
            "type",    "doc",
            "version", 1,
            "content", new Object[]{
                Map.of("type", "heading", "attrs", Map.of("level", 3),
                    "content", new Object[]{
                        Map.of("type", "text", "text", "Defect Details")
                    }),
                Map.of("type", "paragraph",
                    "content", new Object[]{
                        Map.of("type", "text", "text",
                            "Defect Code: " + defect.getCode() + "\n" +
                            "Severity: "    + defect.getSeverity() + "\n" +
                            "Priority: "    + defect.getPriority() + "\n" +
                            "Project: "     + (defect.getProject() != null ? defect.getProject().getName() : "N/A") + "\n" +
                            "\nDescription:\n" + (defect.getDescription() != null ? defect.getDescription() : "No description") + "\n" +
                            "\nReported via TestMgmt Pro")
                    })
            }
        );
    }

    private Map<String, Object> buildAdfText(String text) {
        return Map.of(
            "type",    "doc",
            "version", 1,
            "content", new Object[]{
                Map.of("type", "paragraph",
                    "content", new Object[]{
                        Map.of("type", "text", "text", text)
                    })
            }
        );
    }

    private String mapPriority(com.testmgmt.enums.DefectPriority p) {
        if (p == null) return "Medium";
        return switch (p) {
            case P1 -> "Highest";
            case P2 -> "High";
            case P3 -> "Medium";
            case P4 -> "Low";
        };
    }

    private com.testmgmt.enums.DefectStatus mapJiraStatus(String jiraStatus) {
        if (jiraStatus == null) return null;
        return switch (jiraStatus.toLowerCase()) {
            case "open", "reopened"         -> com.testmgmt.enums.DefectStatus.OPEN;
            case "in progress", "in review" -> com.testmgmt.enums.DefectStatus.IN_PROGRESS;
            case "resolved", "fixed"        -> com.testmgmt.enums.DefectStatus.FIXED;
            case "closed", "done"           -> com.testmgmt.enums.DefectStatus.CLOSED;
            case "rejected", "won't fix",
                 "invalid"                  -> com.testmgmt.enums.DefectStatus.REJECTED;
            default                         -> null;
        };
    }
}
