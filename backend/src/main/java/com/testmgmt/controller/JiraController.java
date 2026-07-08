package com.testmgmt.controller;

import com.testmgmt.dto.response.ResponseDTOs.ApiResponse;
import com.testmgmt.service.JiraService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/jira")
@RequiredArgsConstructor
@Tag(name = "JIRA Integration", description = "JIRA sync endpoints — issue creation, status transitions, webhooks")
public class JiraController {

    private final JiraService jiraService;

    /** Manually push a defect to JIRA and get back the JIRA issue key */
    @PostMapping("/defects/{defectId}/create-issue")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','TESTER','SME')")
    @Operation(summary = "Create a JIRA issue from a TestMgmt defect")
    public ResponseEntity<ApiResponse<Map<String, String>>> createIssue(
            @PathVariable UUID defectId) {
        String issueKey = jiraService.createJiraIssue(defectId);
        if (issueKey != null) {
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("issueKey", issueKey,
                           "url", "https://yourcompany.atlassian.net/browse/" + issueKey)));
        }
        return ResponseEntity.ok(ApiResponse.<Map<String,String>>builder()
                .success(false).message("JIRA integration disabled or issue creation failed")
                .build());
    }

    /** Get live JIRA issue details for a defect */
    @GetMapping("/issues/{issueKey}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','TESTER','SME','VIEWER')")
    @Operation(summary = "Fetch live status and details of a JIRA issue")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getIssue(
            @PathVariable String issueKey) {
        return ResponseEntity.ok(ApiResponse.success(jiraService.getIssue(issueKey)));
    }

    /** Transition JIRA issue status */
    @PostMapping("/issues/{issueKey}/transition")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "Transition a JIRA issue to a new status")
    public ResponseEntity<ApiResponse<Void>> transition(
            @PathVariable String issueKey,
            @RequestParam String targetStatus) {
        boolean ok = jiraService.transitionJiraIssue(issueKey, targetStatus);
        return ok
                ? ResponseEntity.ok(ApiResponse.ok("Transitioned " + issueKey + " → " + targetStatus))
                : ResponseEntity.ok(ApiResponse.<Void>builder()
                        .success(false).message("Transition failed — check JIRA config").build());
    }

    /**
     * JIRA Webhook receiver.
     * Configure in JIRA: Project Settings → Webhooks → URL = https://your-server/api/v1/jira/webhook
     * Events: Issue Updated, Issue Resolved, Issue Closed
     *
     * This endpoint is intentionally open (no auth) because JIRA cannot send auth headers
     * without additional configuration. Secure via secret token or IP allowlist in production.
     */
    @PostMapping("/webhook")
    @Operation(summary = "JIRA webhook receiver — updates defect status when JIRA issue changes")
    public ResponseEntity<String> webhook(@RequestBody String payload) {
        jiraService.handleWebhook(payload);
        return ResponseEntity.ok("OK");
    }

    /** Add a comment on a JIRA issue */
    @PostMapping("/issues/{issueKey}/comment")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','TESTER','SME')")
    @Operation(summary = "Post a comment on a JIRA issue from TestMgmt")
    public ResponseEntity<ApiResponse<Void>> addComment(
            @PathVariable String issueKey,
            @RequestParam String comment) {
        jiraService.addComment(issueKey, comment);
        return ResponseEntity.ok(ApiResponse.ok("Comment posted to " + issueKey));
    }
}
