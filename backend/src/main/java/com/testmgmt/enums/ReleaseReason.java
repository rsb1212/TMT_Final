package com.testmgmt.enums;

public enum ReleaseReason {
    SKILL_MISMATCH,           // Test case requires skills not held by this tester
    WORKLOAD_OVERLOAD,        // Tester has too many cases to complete on time
    UNAVAILABLE_ENVIRONMENT,  // Required test environment is not accessible
    RESOURCE_CONFLICT,        // Conflicting priority work assigned
    KNOWLEDGE_GAP,            // Insufficient domain knowledge to execute
    ON_LEAVE,                 // Tester going on planned leave
    TECHNICAL_BLOCKER,        // Technical issue blocking execution
    REASSIGNMENT_REQUEST,     // Tester proactively requesting reassignment
    OTHER                     // Free-text reason
}
