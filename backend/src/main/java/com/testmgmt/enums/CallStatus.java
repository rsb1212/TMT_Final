package com.testmgmt.enums;

public enum CallStatus {
    SCHEDULED,    // Upcoming, not yet started
    IN_PROGRESS,  // Currently happening
    COMPLETED,    // Done with notes
    CANCELLED,    // Cancelled before it happened
    RESCHEDULED   // Moved to a new time
}
