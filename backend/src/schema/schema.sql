-- ============================================================
--  Uchakide App Manager Schema
--  Description:
--    Standalone schema segment for the App Manager module.
--    Includes master/detail tables with WHO columns, constraints,
--    indexes, and comments consistent with the main project style.
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE OR REPLACE FUNCTION hash_users_password()
RETURNS TRIGGER AS $$
BEGIN
    -- Only hash on INSERT when a plain password is provided
    IF TG_OP = 'INSERT' THEN
        IF NEW.Password_Hash IS NOT NULL AND NEW.Password_Hash !~ '^\$2[aby]\$\d\d\$' THEN
            NEW.Password_Hash := crypt(NEW.Password_Hash, gen_salt('bf'));
        END IF;
        RETURN NEW;
    END IF;

    -- Only hash on UPDATE if the password actually changed and is not already bcrypt
    IF TG_OP = 'UPDATE' THEN
        IF NEW.Password_Hash IS DISTINCT FROM OLD.Password_Hash THEN
            IF NEW.Password_Hash IS NOT NULL AND NEW.Password_Hash !~ '^\$2[aby]\$\d\d\$' THEN
                NEW.Password_Hash := crypt(NEW.Password_Hash, gen_salt('bf'));
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE Project (
    ID BIGSERIAL PRIMARY KEY,
    Project_Name VARCHAR(200) NOT NULL,
    Description TEXT,
    User_Type VARCHAR(120),
    Start_Date DATE,
    End_Date DATE,
    URL TEXT,
    Developer_Assigned VARCHAR(120),
    Figma_Link TEXT,
    Template VARCHAR(120),
    Project_Status VARCHAR(50) NOT NULL DEFAULT 'Planned',
    Project_Cost NUMERIC(14,2),
    Time_Weeks INT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_project_dates CHECK (
        End_Date IS NULL OR Start_Date IS NULL OR End_Date >= Start_Date
    )
);
COMMENT ON TABLE Project IS 'Master catalog of projects managed inside the Uchakide App Manager.';
CREATE INDEX IF NOT EXISTS idx_project_status ON Project(Project_Status);
CREATE INDEX IF NOT EXISTS idx_project_dates ON Project(Start_Date, End_Date);

CREATE TABLE Users (
    ID BIGSERIAL PRIMARY KEY,
    Name VARCHAR(150) NOT NULL,
    Username VARCHAR(120) UNIQUE NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    Password_Hash TEXT NOT NULL,
    User_Type VARCHAR(120),
    Status VARCHAR(50) NOT NULL DEFAULT 'Active',
    Notes TEXT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);
 COMMENT ON TABLE Users IS 'Users dedicated to the Uchakide App Manager module.';
 CREATE INDEX IF NOT EXISTS idx_app_users_username ON Users(Username);

CREATE TRIGGER Users_password_hash
    BEFORE INSERT OR UPDATE ON Users
    FOR EACH ROW EXECUTE FUNCTION hash_users_password();    

-- Deprecated table removed: UserModuleAccess

CREATE TABLE Project_Payments (
    ID BIGSERIAL PRIMARY KEY,
    Project_ID BIGINT NOT NULL REFERENCES Project(ID) ON DELETE CASCADE,
    Payment_Amount NUMERIC(14,2) NOT NULL,
    Payment_Type VARCHAR(50) NOT NULL DEFAULT 'Milestone',
    Payment_Status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    Payment_Date DATE NOT NULL DEFAULT CURRENT_DATE,
    Notes TEXT,
    Attachment BYTEA,
    Attachment_Filename VARCHAR(255),
    Attachment_Mime VARCHAR(255),
    Attachment_Size INT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE Project_Payments IS 'Milestone and financial transactions tracked per project.';
CREATE INDEX IF NOT EXISTS idx_project_payments_project ON Project_Payments(Project_ID);
CREATE INDEX IF NOT EXISTS idx_project_payments_status ON Project_Payments(Payment_Status);

-- Create Project_Menus before Bugs to satisfy Bugs(Menu_ID) FK
CREATE TABLE Project_Menus (
    ID BIGSERIAL PRIMARY KEY,
    Project_ID BIGINT NOT NULL REFERENCES Project(ID) ON DELETE CASCADE,
    Menu_Type VARCHAR(50) NOT NULL, -- Navigation Menu / Navigation Bar
    Menu_Name VARCHAR(200) NOT NULL,
    Menu_Parent VARCHAR(200),
    Icon VARCHAR(120),
    Description TEXT,
    Sort_Order INT,
    Attachment BYTEA,
    Attachment_Filename VARCHAR(255),
    Attachment_Mime VARCHAR(255),
    Attachment_Size INT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE Project_Menus IS 'Project navigation pages/menus including hierarchy and expected page design attachment.';
CREATE INDEX IF NOT EXISTS idx_project_menus_project ON Project_Menus(Project_ID);

CREATE TABLE Project_Bugs (
    ID BIGSERIAL PRIMARY KEY,
    Project_ID BIGINT NOT NULL REFERENCES Project(ID) ON DELETE CASCADE,
    Type VARCHAR(150) NOT NULL,
    Description TEXT NOT NULL,
    Menu_ID BIGINT REFERENCES Project_Menus(ID) ON DELETE SET NULL,
    Priority VARCHAR(30) NOT NULL DEFAULT 'Medium',
    Status VARCHAR(30) NOT NULL DEFAULT 'Open',
    Attachment BYTEA,
    Attachment_Filename VARCHAR(255),
    Attachment_Mime VARCHAR(255),
    Attachment_Size INT,
    Source VARCHAR(50) NOT NULL DEFAULT 'Internal',
    Reported_By VARCHAR(150),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE Project_Bugs IS 'Bugs, QA findings, and internal tasks linked to a project.';
CREATE INDEX IF NOT EXISTS idx_project_bugs_project ON Project_Bugs(Project_ID);
CREATE INDEX IF NOT EXISTS idx_project_bugs_status ON Project_Bugs(Status);
CREATE INDEX IF NOT EXISTS idx_project_bugs_priority ON Project_Bugs(Priority);
CREATE INDEX IF NOT EXISTS idx_project_bugs_menu ON Project_Bugs(Menu_ID);

-- Restore Project_Roles
CREATE TABLE IF NOT EXISTS Project_Roles (
    ID BIGSERIAL PRIMARY KEY,
    Project_ID BIGINT NOT NULL REFERENCES Project(ID) ON DELETE CASCADE,
    Role_Name VARCHAR(50) NOT NULL,
    Notes TEXT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_project_role UNIQUE (Project_ID, Role_Name)
);
COMMENT ON TABLE Project_Roles IS 'Per-project roles used by RBAC mapping.';
CREATE INDEX IF NOT EXISTS idx_project_roles_project ON Project_Roles(Project_ID);

CREATE TABLE Project_Tables (
    ID BIGSERIAL PRIMARY KEY,
    Project_ID BIGINT NOT NULL REFERENCES Project(ID) ON DELETE CASCADE,
    Table_Name VARCHAR(200) NOT NULL,
    Field_Definitions JSONB DEFAULT '[]'::JSONB,
    Found_At VARCHAR(200),
    Parent_Table VARCHAR(200),
    Relationship_Type VARCHAR(120),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_project_table UNIQUE (Project_ID, Table_Name)
);
COMMENT ON TABLE Project_Tables IS 'Metadata catalog describing the tables and relationships for each project.';
CREATE INDEX IF NOT EXISTS idx_project_tables_project ON Project_Tables(Project_ID);

CREATE TABLE Project_Reports (
    ID BIGSERIAL PRIMARY KEY,
    Project_ID BIGINT NOT NULL REFERENCES Project(ID) ON DELETE CASCADE,
    Report_Name VARCHAR(200) NOT NULL,
    Fields_Displayed JSONB DEFAULT '[]'::JSONB,
    Description TEXT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE Project_Reports IS 'Report definitions, filters, and export settings per project.';
CREATE INDEX IF NOT EXISTS idx_project_reports_project ON Project_Reports(Project_ID);

CREATE TABLE Project_Role_Menu_Access (
    ID BIGSERIAL PRIMARY KEY,
    Project_ID BIGINT NOT NULL REFERENCES Project(ID) ON DELETE CASCADE,
    Role_ID BIGINT NOT NULL REFERENCES Project_Roles(ID) ON DELETE CASCADE,
    Access_JSON JSONB NOT NULL DEFAULT '[]'::JSONB,
    Notes TEXT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_role_menu UNIQUE (Project_ID, Role_ID)
);
COMMENT ON TABLE Project_Role_Menu_Access IS 'RBAC Role->Menu mapping per project with visibility and access levels.';
CREATE INDEX IF NOT EXISTS idx_role_menu_project ON Project_Role_Menu_Access(Project_ID);
-- Project_Attachments table removed per design change

-- ============================================================
--  Seed Data
-- ============================================================

-- Users
INSERT INTO Users (
    ID,
    Name,
    Username,
    Email,
    Password_Hash,
    User_Type,
    Status,
    Notes,
    Created_By,
    Updated_By
) VALUES
(
    1,
    'Super User',
    'super',
    'super@uchakide.org',
    '12345',
    'Super User',
    'Active',
    'Seeded super user with complete access',
    'system',
    'system'
) ON CONFLICT (ID) DO NOTHING;

-- RBAC minimal project and role/menu seeds
INSERT INTO Project (ID, Project_Name, Project_Status, Created_By, Updated_By)
VALUES (1000, 'Sample Project', 'Active', 'system', 'system')
ON CONFLICT (ID) DO NOTHING;

INSERT INTO Project_Tables (ID, Project_ID, Table_Name, Field_Definitions, Created_By, Updated_By)
VALUES (2000, 1000, 'Sample_Table', '[]'::JSONB, 'system', 'system')
ON CONFLICT (ID) DO NOTHING;

INSERT INTO Project_Reports (ID, Project_ID, Report_Name, Fields_Displayed, Created_By, Updated_By)
VALUES (3000, 1000, 'Sample_Report', '[]'::JSONB, 'system', 'system')
ON CONFLICT (ID) DO NOTHING;

INSERT INTO Project_Menus (ID, Project_ID, Menu_Type, Menu_Name, Menu_Parent, Icon, Sort_Order, Created_By, Updated_By)
VALUES
(5000, 1000, 'Navigation Menu', 'Dashboard', NULL, 'bx bx-home', 1, 'system', 'system'),
(5001, 1000, 'Navigation Menu', 'Reports', NULL, 'bx bx-bar-chart', 2, 'system', 'system'),
(5002, 1000, 'Navigation Menu', 'Tables', NULL, 'bx bx-table', 3, 'system', 'system')
ON CONFLICT (ID) DO NOTHING;

-- Seed roles
INSERT INTO Project_Roles (ID, Project_ID, Role_Name, Notes, Created_By, Updated_By)
VALUES
(4000, 1000, 'Developer', 'Seed role', 'system', 'system'),
(4001, 1000, 'ProjectManager', 'Seed role', 'system', 'system')
ON CONFLICT (ID) DO NOTHING;

INSERT INTO Project_Role_Menu_Access (Project_ID, Role_ID, Access_JSON, Created_By, Updated_By)
VALUES
(1000, 4000, '[{"menu_id":5000,"menu_name":"Dashboard","visibility":"Show","access_level":"Read"},{"menu_id":5001,"menu_name":"Reports","visibility":"Show","access_level":"Read"}]'::JSONB, 'system', 'system'),
(1000, 4001, '[{"menu_id":5000,"menu_name":"Dashboard","visibility":"Show","access_level":"Write"},{"menu_id":5002,"menu_name":"Tables","visibility":"Show","access_level":"Write"}]'::JSONB, 'system', 'system')
ON CONFLICT (Project_ID, Role_ID) DO NOTHING;