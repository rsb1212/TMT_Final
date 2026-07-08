package com.testmgmt.enums;

public enum NotificationType {
    ASSIGNED,
    REASSIGNED,
    DUE_SOON,
    OVERDUE,
    DEFECT_RAISED,
    SME_APPROVED,
    SME_REJECTED,
    UAT_READY,
    SIGN_OFF,
    CALL_SCHEDULED,
    CALL_NOTES_READY,
    RELEASE_REQUESTED,   // Manager notified when tester requests release
    CASE_RELEASED        // Tester notified when manager confirms release
}
