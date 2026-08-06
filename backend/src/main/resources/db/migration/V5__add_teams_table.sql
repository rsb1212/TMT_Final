-- V5__add_teams_table.sql
-- Add Teams table for managing multiple teams within an organization (tenant)

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    team_type VARCHAR(50),       -- QA, DEV, UAT, SUPPORT, etc.
    department VARCHAR(100),     -- Operations, Sales, IT, etc.
    channel VARCHAR(100),        -- Branch, Digital, etc.
    lead_id UUID,                -- Team lead user
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_team_code_tenant UNIQUE (code, tenant_id)
);

-- Create indexes for teams
CREATE INDEX IF NOT EXISTS idx_teams_tenant ON teams(tenant_id);
CREATE INDEX IF NOT EXISTS idx_teams_code ON teams(code);
CREATE INDEX IF NOT EXISTS idx_teams_active ON teams(active);
CREATE INDEX IF NOT EXISTS idx_teams_department ON teams(department);
CREATE INDEX IF NOT EXISTS idx_teams_channel ON teams(channel);

-- Add team_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_id UUID;
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team_id);

-- Update tenant table - remove logo_url if not needed, keep it simple
-- Organizations don't need external URLs
COMMENT ON TABLE tenants IS 'Organizations - top level entity for multi-tenancy';
COMMENT ON TABLE teams IS 'Teams within an organization - for organizing users into groups';

-- Insert sample teams for existing tenants (optional)
-- This creates default teams for any existing tenant
INSERT INTO teams (id, tenant_id, code, name, description, team_type, department, active)
SELECT 
    gen_random_uuid(),
    t.id,
    'DEFAULT',
    'Default Team',
    'Default team for ' || t.name,
    'GENERAL',
    'General',
    true
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM teams tm WHERE tm.tenant_id = t.id
);
