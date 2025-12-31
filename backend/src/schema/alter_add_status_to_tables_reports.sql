-- ============================================================
--  ALTER Script: Add Status Field to Project_Tables and Project_Reports
--  Description: Adds a Status column with default value 'In progress'
--  Status values: 'In progress', 'Done', 'In Review'
-- ============================================================

-- Add Status column to Project_Tables
ALTER TABLE Project_Tables
ADD COLUMN IF NOT EXISTS Status VARCHAR(50) NOT NULL DEFAULT 'In progress';

-- Add comment for Project_Tables Status column
COMMENT ON COLUMN Project_Tables.Status IS 'Status of the table: In progress, Done, or In Review';

-- Create index on Status for Project_Tables
CREATE INDEX IF NOT EXISTS idx_project_tables_status ON Project_Tables(Status);

-- Add Status column to Project_Reports
ALTER TABLE Project_Reports
ADD COLUMN IF NOT EXISTS Status VARCHAR(50) NOT NULL DEFAULT 'In progress';

-- Add comment for Project_Reports Status column
COMMENT ON COLUMN Project_Reports.Status IS 'Status of the report: In progress, Done, or In Review';

-- Create index on Status for Project_Reports
CREATE INDEX IF NOT EXISTS idx_project_reports_status ON Project_Reports(Status);

-- Update existing records to have default status if they don't have one
UPDATE Project_Tables SET Status = 'In progress' WHERE Status IS NULL;
UPDATE Project_Reports SET Status = 'In progress' WHERE Status IS NULL;

