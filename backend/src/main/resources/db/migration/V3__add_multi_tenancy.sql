-- Multi-tenancy migration
-- Add tenant support to all entities

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT true,
    settings TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Create index on tenant code
CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(code);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(active);

-- Add tenant_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- Add tenant_id to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);

-- Add tenant_id to test_cases table
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_test_cases_tenant ON test_cases(tenant_id);

-- Add tenant_id to test_executions table
ALTER TABLE test_executions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_test_executions_tenant ON test_executions(tenant_id);

-- Add tenant_id to defects table
ALTER TABLE defects ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_defects_tenant ON defects(tenant_id);

-- Add tenant_id to requirements table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'requirements') THEN
        ALTER TABLE requirements ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
        CREATE INDEX IF NOT EXISTS idx_requirements_tenant ON requirements(tenant_id);
    END IF;
END $$;

-- Add tenant_id to call_numbers table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_numbers') THEN
        ALTER TABLE call_numbers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
        CREATE INDEX IF NOT EXISTS idx_call_numbers_tenant ON call_numbers(tenant_id);
    END IF;
END $$;

-- Add tenant_id to modules table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modules') THEN
        ALTER TABLE modules ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
        CREATE INDEX IF NOT EXISTS idx_modules_tenant ON modules(tenant_id);
    END IF;
END $$;

-- Add tenant_id to tags table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tags') THEN
        ALTER TABLE tags ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
        CREATE INDEX IF NOT EXISTS idx_tags_tenant ON tags(tenant_id);
    END IF;
END $$;

-- Insert a default tenant for existing data
INSERT INTO tenants (id, code, name, description, active)
VALUES ('00000000-0000-0000-0000-000000000001', 'DEFAULT', 'Default Organization', 'Default tenant for existing data', true)
ON CONFLICT (code) DO NOTHING;

-- Update existing records to use default tenant
UPDATE users SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE projects SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE test_cases SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE test_executions SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE defects SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

-- Update requirements if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'requirements') THEN
        EXECUTE 'UPDATE requirements SET tenant_id = ''00000000-0000-0000-0000-000000000001'' WHERE tenant_id IS NULL';
    END IF;
END $$;

-- Update call_numbers if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_numbers') THEN
        EXECUTE 'UPDATE call_numbers SET tenant_id = ''00000000-0000-0000-0000-000000000001'' WHERE tenant_id IS NULL';
    END IF;
END $$;

-- Update modules if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modules') THEN
        EXECUTE 'UPDATE modules SET tenant_id = ''00000000-0000-0000-0000-000000000001'' WHERE tenant_id IS NULL';
    END IF;
END $$;

-- Update tags if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tags') THEN
        EXECUTE 'UPDATE tags SET tenant_id = ''00000000-0000-0000-0000-000000000001'' WHERE tenant_id IS NULL';
    END IF;
END $$;

-- Make username and email unique within tenant (not globally)
-- First drop existing unique constraints if they exist
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Create new composite unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_username ON users(tenant_id, username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);
