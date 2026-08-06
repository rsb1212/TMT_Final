-- Migration: Add Call Number Management Feature
-- Date: 2026-08-05
-- Issues Addressed: #15-20 (Call Number Management Module)

-- Create call_numbers table
CREATE TABLE IF NOT EXISTS call_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID NOT NULL REFERENCES projects(id),
    parent_call_number_id UUID REFERENCES call_numbers(id),
    external_reference VARCHAR(100),
    jira_key VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uk_call_number_code_project UNIQUE(code, project_id)
);

-- Create indexes for call_numbers
CREATE INDEX IF NOT EXISTS idx_call_number_project ON call_numbers(project_id);
CREATE INDEX IF NOT EXISTS idx_call_number_parent ON call_numbers(parent_call_number_id);
CREATE INDEX IF NOT EXISTS idx_call_number_code ON call_numbers(code);
CREATE INDEX IF NOT EXISTS idx_call_number_active ON call_numbers(active);

-- Add call_number_id column to test_cases table
ALTER TABLE test_cases 
ADD COLUMN IF NOT EXISTS call_number_id UUID REFERENCES call_numbers(id);

-- Create index for call_number_id in test_cases
CREATE INDEX IF NOT EXISTS idx_tc_call_number ON test_cases(call_number_id);

-- Issue #22: Add call_number_id column to defects table
ALTER TABLE defects 
ADD COLUMN IF NOT EXISTS call_number_id UUID REFERENCES call_numbers(id);

-- Create index for call_number_id in defects
CREATE INDEX IF NOT EXISTS idx_def_call_number ON defects(call_number_id);

-- Add comment for documentation
COMMENT ON TABLE call_numbers IS 'Call Number Management - tracks test cases under specific call numbers with hierarchical structure';
COMMENT ON COLUMN call_numbers.code IS 'Unique call number code (e.g., CALL-001, PDT-19882)';
COMMENT ON COLUMN call_numbers.parent_call_number_id IS 'Parent call number ID for hierarchical structure (null = root/parent)';
COMMENT ON COLUMN call_numbers.jira_key IS 'External Jira ticket key if linked';
COMMENT ON COLUMN test_cases.call_number_id IS 'Reference to associated call number';

-- Grant permissions (adjust role name as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON call_numbers TO app_user;
