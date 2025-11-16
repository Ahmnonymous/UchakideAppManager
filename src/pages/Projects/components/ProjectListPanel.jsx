import React from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Spinner,
  UncontrolledTooltip,
} from "reactstrap";
import { useRole } from "../../../helpers/useRole";

const ProjectListPanel = ({
  projects,
  selectedProject,
  searchTerm,
  onSearchChange,
  onSelectProject,
  loading,
  onRefresh,
  onCreate,
}) => {
  const { isOrgExecutive } = useRole();

  return (
    <Card className="border shadow-sm h-100">
      <CardBody className="p-0 d-flex flex-column">
        <div className="p-3 border-bottom">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="card-title mb-0 fw-semibold font-size-14">
              <i className="bx bx-layer me-2 text-primary" />
              Projects
            </h6>
            <div className="d-flex gap-2">
              <Button
                color="link"
                size="sm"
                className="text-muted p-0"
                onClick={onRefresh}
                id="project-list-refresh"
              >
                <i className="bx bx-refresh font-size-18" />
              </Button>
              <UncontrolledTooltip target="project-list-refresh" placement="bottom">
                Refresh
              </UncontrolledTooltip>
              {!isOrgExecutive && (
                <>
                  <Button
                    color="primary"
                    size="sm"
                    onClick={onCreate}
                    id="project-list-create"
                  >
                    <i className="bx bx-plus font-size-12"></i>
                  </Button>
                  <UncontrolledTooltip target="project-list-create" placement="bottom">
                    Create Project
                  </UncontrolledTooltip>
                </>
              )}
            </div>
          </div>
          <div className="position-relative">
            <Input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="form-control form-control-sm"
            />
            <i className="bx bx-search-alt position-absolute top-50 end-0 translate-middle-y me-3 text-muted font-size-14" />
          </div>
        </div>

        <div
          className="flex-grow-1 p-3"
          style={{ height: "calc(100vh - 200px)", overflowY: "auto" }}
        >
          {loading && (
            <div className="text-center py-4">
              <Spinner color="primary" size="sm" />
              <p className="mt-2 text-muted font-size-12">Loading...</p>
            </div>
          )}

          {!loading && projects.length === 0 && (
            <div className="text-center py-4">
              <i className="bx bx-search-alt font-size-24 text-muted mb-2" />
              <h6 className="font-size-13 mb-1">No Projects Found</h6>
              <p className="text-muted mb-0 font-size-11">
                Try adjusting your search
              </p>
            </div>
          )}

          {!loading && projects.length > 0 && (
            <div className="d-flex flex-column gap-2">
              {projects.map((project) => {
                const isSelected = selectedProject?.id === project.id;
                return (
                  <div
                    key={project.id}
                    className={`rounded border ${
                      isSelected
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-light"
                    }`}
                    onClick={() => onSelectProject(project)}
                    style={{
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      padding: "12px 16px",
                      color: "inherit",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="flex-grow-1">
                        <h6
                          className={`mb-1 font-size-13 fw-semibold ${
                            isSelected ? "text-white" : ""
                          }`}
                        >
                          {project.project_name}
                        </h6>
                        <p
                          className={`mb-0 font-size-11 ${
                            isSelected ? "text-white-50" : "text-muted"
                          }`}
                        >
                          {project.project_status || "Unknown"} ·{" "}
                          {project.developer_assigned || "Unassigned"}
                        </p>
                      </div>
                      {isSelected && (
                        <i className="bx bx-check-circle font-size-16 text-white" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default ProjectListPanel;


