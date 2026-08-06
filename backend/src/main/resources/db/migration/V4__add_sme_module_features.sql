-- V4__add_sme_module_features.sql
-- Add SME Module Dashboard features

-- Add new columns to modules table with default values
ALTER TABLE modules ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS channel VARCHAR(50);
ALTER TABLE modules ADD COLUMN IF NOT EXISTS department VARCHAR(50);
ALTER TABLE modules ADD COLUMN IF NOT EXISTS module_type VARCHAR(30);

-- Handle active column - first add as nullable with default, then update, then make NOT NULL
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'modules' AND column_name = 'active') THEN
        ALTER TABLE modules ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Set active = true for all existing modules with NULL active
UPDATE modules SET active = true WHERE active IS NULL;

-- Now make it NOT NULL
ALTER TABLE modules ALTER COLUMN active SET NOT NULL;
ALTER TABLE modules ALTER COLUMN active SET DEFAULT true;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_modules_channel ON modules(channel);
CREATE INDEX IF NOT EXISTS idx_modules_department ON modules(department);

-- Create SME Module Assignment table
CREATE TABLE IF NOT EXISTS sme_module_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sme_id UUID NOT NULL REFERENCES users(id),
    module_id UUID NOT NULL REFERENCES modules(id),
    channel VARCHAR(50),
    department VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT true,
    tenant_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_sme_module UNIQUE (sme_id, module_id)
);

-- Create indexes for SME Module Assignments
CREATE INDEX IF NOT EXISTS idx_sme_module_sme ON sme_module_assignments(sme_id);
CREATE INDEX IF NOT EXISTS idx_sme_module_module ON sme_module_assignments(module_id);
CREATE INDEX IF NOT EXISTS idx_sme_module_tenant ON sme_module_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sme_module_active ON sme_module_assignments(active);
