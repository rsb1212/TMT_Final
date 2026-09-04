package com.testmgmt.enums;

/**
 * Lifecycle/management status of a PD/CR call as it moves through UAT.
 * This is the "tracking" status the dashboard groups by.
 */
public enum PdCrCallStatus {
    OPEN,          // logged, not yet started
    IN_PROGRESS,   // development / fixing in progress
    UAT,           // in UAT
    SHOW_STOPPER,  // blocked / show-stopper (maps Jira "Show Stopper" states)
    SIGNED_OFF,    // UAT sign-off done
    CLOSED         // fully closed
}
