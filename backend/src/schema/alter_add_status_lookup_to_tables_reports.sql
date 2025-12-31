-- ============================================================
--  ALTER Script: Add Status Field (Lookup) to Project_Tables and Project_Reports
--  Description: Adds a Status column with lookup values
--  Status values: 'In progress', 'Done', 'In Review'
--  Date: Generated for Uchakide App Manager
-- ============================================================

-- Add Status column to Project_Tables if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_tables' AND column_name = 'status'
    ) THEN
        ALTER TABLE Project_Tables
        ADD COLUMN Status VARCHAR(50) NOT NULL DEFAULT 'In progress';
        
        COMMENT ON COLUMN Project_Tables.Status IS 'Status lookup: In progress, Done, or In Review';
        
        CREATE INDEX IF NOT EXISTS idx_project_tables_status ON Project_Tables(Status);
        
        -- Update existing records to have default status
        UPDATE Project_Tables SET Status = 'In progress' WHERE Status IS NULL;
    END IF;
END $$;

-- Add Status column to Project_Reports if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_reports' AND column_name = 'status'
    ) THEN
        ALTER TABLE Project_Reports
        ADD COLUMN Status VARCHAR(50) NOT NULL DEFAULT 'In progress';
        
        COMMENT ON COLUMN Project_Reports.Status IS 'Status lookup: In progress, Done, or In Review';
        
        CREATE INDEX IF NOT EXISTS idx_project_reports_status ON Project_Reports(Status);
        
        -- Update existing records to have default status
        UPDATE Project_Reports SET Status = 'In progress' WHERE Status IS NULL;
    END IF;
END $$;

-- Verify the changes
SELECT 
    'Project_Tables' as table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'project_tables' AND column_name = 'status'
UNION ALL
SELECT 
    'Project_Reports' as table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'project_reports' AND column_name = 'status';

