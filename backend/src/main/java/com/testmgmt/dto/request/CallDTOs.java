package com.testmgmt.dto.request;

import com.testmgmt.enums.CallStatus;
import com.testmgmt.enums.CallType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class CallDTOs {

    @Data
    public static class CreateCallRequest {
        @NotBlank  private String    title;
        @NotNull   private CallType  callType;
        @NotNull   private UUID      projectId;
        @NotNull   private Instant   scheduledAt;
                   private String    agenda;
                   private String    meetingUrl;
                   private String    platform;
                   private UUID      moduleId;
                   private Integer   durationMinutes;
                   private List<UUID> participantIds;
                   private List<UUID> testCaseIds;
                   private List<UUID> defectIds;
                   private Boolean   isRecurring;
                   private String    recurrencePattern;
    }

    @Data
    public static class UpdateCallRequest {
                   private String    title;
                   private String    agenda;
                   private CallType  callType;
                   private Instant   scheduledAt;
                   private String    meetingUrl;
                   private String    platform;
                   private Integer   durationMinutes;
                   private List<UUID> participantIds;
                   private List<UUID> testCaseIds;
                   private List<UUID> defectIds;
    }

    @Data
    public static class CompleteCallRequest {
                   private Instant   startedAt;
                   private Instant   endedAt;
                   private Integer   durationMinutes;
                   private String    minutes;        // MoM
                   private String    actionItems;
                   private String    decisions;
    }

    @Data
    public static class UpdateCallStatusRequest {
        @NotNull private CallStatus status;
                 private String     reason;
    }
}
