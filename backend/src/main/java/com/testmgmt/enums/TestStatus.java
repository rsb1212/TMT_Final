package com.testmgmt.enums;

public enum TestStatus {
    DRAFT,
    PENDING_SME_REVIEW,
    SME_REVIEWING,
    SME_APPROVED,
    ASSIGNED,
    IN_PROGRESS,
    UNDER_REVIEW,
    PASSED,
    FAILED,
    DEFECT_RAISED,
    SIGNED_OFF,
    UAT_PENDING,
    UAT_IN_PROGRESS,
    UAT_PASSED,
    REDEVELOPMENT,
    RETEST,
    NA,
    NOT_RELEASED,
    RELEASE_REQUESTED,   // Tester has requested to release — awaiting Manager action
    RELEASED,            // Manager confirmed release — ready for reassignment
    DEPRECATED
}
