package com.testmgmt.enums;

/**
 * Legacy enum for backward compatibility.
 * New code should use the dynamic RepositoryCategory entity from com.testmgmt.entity package.
 * 
 * @deprecated Use com.testmgmt.entity.RepositoryCategoryEntity for dynamic categories
 */
@Deprecated
public enum RepositoryCategory {
    BUSINESS_REQUIREMENTS,
    FUNCTIONAL_REQUIREMENTS,
    TEST_CASES,
    TEST_DATA,
    USER_GUIDES,
    RELEASE_NOTES,
    EVIDENCE_FILES,
    PROJECT_TEMPLATES
}
