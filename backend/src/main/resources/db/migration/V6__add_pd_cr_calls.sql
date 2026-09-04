-- PD/CR Call tracking module
-- Creates the pd_cr_calls table backing com.testmgmt.entity.PdCrCall
-- Safe/idempotent: uses IF NOT EXISTS so it can run against any environment.

CREATE TABLE IF NOT EXISTS pd_cr_calls (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at                TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMP NOT NULL DEFAULT NOW(),

    tenant_id                 UUID,

    -- Identity
    child_call_id             VARCHAR(60)  NOT NULL,
    parent_call_id            VARCHAR(60),

    -- Classification
    category                  VARCHAR(40),
    call_type                 VARCHAR(20)  NOT NULL DEFAULT 'OTHER',
    testing_environment       VARCHAR(100),
    in_scope                  VARCHAR(100),
    automation_scope          VARCHAR(100),
    issue_description         TEXT,
    priority                  VARCHAR(20),

    -- Ownership
    uat_spoc                  VARCHAR(120),
    responsible_spoc          VARCHAR(200),
    responsible_team          VARCHAR(120),
    application_owner         VARCHAR(120),
    date_assigned_to_owner    DATE,

    -- UAT dates
    uat_release_date          DATE,
    uat_completion_tentative  DATE,
    uat_completion_actual     DATE,
    uat_signoff_tentative     DATE,
    uat_signoff_actual        DATE,

    -- Status / tracking
    current_jira_status       VARCHAR(120),
    status                    VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    latest_update             TEXT,
    open_defects              TEXT,

    -- Relations
    project_id                UUID REFERENCES projects(id),
    active                    BOOLEAN NOT NULL DEFAULT TRUE
);

-- Indexes (mirror the @Index definitions on the entity)
CREATE INDEX IF NOT EXISTS idx_pdcr_project    ON pd_cr_calls(project_id);
CREATE INDEX IF NOT EXISTS idx_pdcr_tenant     ON pd_cr_calls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pdcr_call_type  ON pd_cr_calls(call_type);
CREATE INDEX IF NOT EXISTS idx_pdcr_status     ON pd_cr_calls(status);
CREATE INDEX IF NOT EXISTS idx_pdcr_child_call ON pd_cr_calls(child_call_id);
CREATE INDEX IF NOT EXISTS idx_pdcr_app_owner  ON pd_cr_calls(application_owner);

-- Unique: one child call ID per project
CREATE UNIQUE INDEX IF NOT EXISTS uk_pdcr_child_call_project
    ON pd_cr_calls(child_call_id, project_id);
