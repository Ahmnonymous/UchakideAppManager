import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Container, Row, Col, Alert, Spinner } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import ProjectListPanel from "./components/ProjectListPanel";
import ProjectSummary from "./components/ProjectSummary";
import SummaryMetrics from "./components/SummaryMetrics";
import DetailTabs from "./components/DetailTabs";
import ProjectFormModal from "./components/modals/ProjectFormModal";

const ProjectManagement = () => {
  document.title = "Project Management | Uchakide App Manager";

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [summary, setSummary] = useState(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectModalItem, setProjectModalItem] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const searchTimeoutRef = useRef(null);

  const getAlertIcon = (color) => {
    switch (color) {
      case "success":
        return "mdi mdi-check-all";
      case "danger":
        return "mdi mdi-block-helper";
      case "warning":
        return "mdi mdi-alert-outline";
      case "info":
        return "mdi mdi-alert-circle-outline";
      default:
        return "mdi mdi-information";
    }
  };

  const getAlertBackground = (color) => {
    switch (color) {
      case "success":
        return "#d4edda";
      case "danger":
        return "#f8d7da";
      case "warning":
        return "#fff3cd";
      case "info":
        return "#d1ecf1";
      default:
        return "#f8f9fa";
    }
  };

  const getAlertBorder = (color) => {
    switch (color) {
      case "success":
        return "#c3e6cb";
      case "danger":
        return "#f5c6cb";
      case "warning":
        return "#ffeaa7";
      case "info":
        return "#bee5eb";
      default:
        return "#dee2e6";
    }
  };

  const showAlert = useCallback((message, color = "success") => {
    setAlert({ message, color });
    setTimeout(() => setAlert(null), 4000);
  }, []);

  const fetchProjects = useCallback(async (search = null, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('limit', '50');
      params.append('sort', 'created_at');
      params.append('order', 'desc');

      const response = await axiosApi.get(
        `${API_BASE_URL}/appManager/projects?${params.toString()}`
      );
      
      // Handle both paginated and non-paginated responses (backward compatibility)
      const responseData = response.data || {};
      const data = responseData.data || responseData || [];
      const paginationData = responseData.pagination || {};

      setProjects(data);
      setPagination({
        page: paginationData.page || page,
        limit: paginationData.limit || 50,
        total: paginationData.total || data.length,
        totalPages: paginationData.totalPages || Math.ceil((paginationData.total || data.length) / (paginationData.limit || 50)),
      });

      setSelectedProject((current) => {
        if (!current && data.length > 0) {
          return data[0];
        }
        if (current) {
          const updated = data.find((project) => project.id === current.id);
          return updated || data[0] || null;
        }
        return null;
      });
    } catch (error) {
      console.error("Error loading projects:", error);
      showAlert(
        error?.response?.data?.error || "Unable to load projects",
        "danger",
      );
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  const fetchProjectSummary = useCallback(
    async (projectId, silent = false) => {
      if (!projectId) {
        setSummary(null);
        return;
      }
      // Only show loading spinner on initial load, not on silent refreshes
      if (!silent) {
        setDetailLoading(true);
      }
      try {
        const response = await axiosApi.get(
          `${API_BASE_URL}/appManager/projects/${projectId}/summary`,
        );
        setSummary(response.data || null);
      } catch (error) {
        console.error("Error loading project summary:", error);
        // Only show alert on non-silent refreshes to avoid spam
        if (!silent) {
          showAlert(
            error?.response?.data?.error ||
              "Unable to load project details. Please try again.",
            "warning",
          );
        }
        setSummary(null);
      } finally {
        if (!silent) {
          setDetailLoading(false);
        }
      }
    },
    [showAlert],
  );

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchProjects(searchTerm || null, 1);
    }, 500); // 500ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]); // Only depend on searchTerm

  useEffect(() => {
    if (selectedProject?.id) {
      fetchProjectSummary(selectedProject.id);
    } else {
      setSummary(null);
    }
  }, [selectedProject, fetchProjectSummary]);

  // Server-side search is now used, so no client-side filtering needed
  const filteredProjects = projects;

  const handleProjectSave = async (payload, editItem) => {
    try {
      if (editItem?.id) {
        await axiosApi.put(
          `${API_BASE_URL}/appManager/projects/${editItem.id}`,
          payload,
        );
        showAlert("Project has been updated successfully.");
      } else {
        await axiosApi.post(`${API_BASE_URL}/appManager/projects`, payload);
        showAlert("Project has been created successfully.");
      }
      setProjectModalOpen(false);
      setProjectModalItem(null);
      await fetchProjects();
    } catch (error) {
      console.error("Error saving project:", error);
      showAlert(
        error?.response?.data?.error || "Unable to save project",
        "danger",
      );
    }
  };

  const handleProjectDelete = async (projectId) => {
    try {
      await axiosApi.delete(`${API_BASE_URL}/appManager/projects/${projectId}`);
      showAlert("Project has been deleted successfully.");
      setProjectModalOpen(false);
      setProjectModalItem(null);
      setSelectedProject((current) =>
        current?.id === projectId ? null : current,
      );
      await fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      showAlert(
        error?.response?.data?.error || "Unable to delete project",
        "danger",
      );
    }
  };

  const refreshDetails = useCallback((silent = true) => {
    if (selectedProject?.id) {
      fetchProjectSummary(selectedProject.id, silent);
    }
  }, [selectedProject, fetchProjectSummary]);

  return (
    <div className="page-content">
      <Container fluid>
        {alert && (
          <div
            className="position-fixed top-0 end-0 p-3"
            style={{ zIndex: 1060, minWidth: "300px", maxWidth: "500px" }}
          >
            <Alert
              color={alert.color}
              isOpen={!!alert}
              toggle={() => setAlert(null)}
              className="alert-dismissible fade show shadow-lg"
              role="alert"
              style={{
                opacity: 1,
                backgroundColor: getAlertBackground(alert.color),
                border: `1px solid ${getAlertBorder(alert.color)}`,
                color: "#000",
              }}
            >
              <i className={`${getAlertIcon(alert.color)} me-2`} />
              {alert.message}
            </Alert>
          </div>
        )}

        <Breadcrumbs title="Projects" breadcrumbItem="Project Management" />

        <Row>
          <Col lg={3}>
            <ProjectListPanel
              projects={filteredProjects}
              selectedProject={selectedProject}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSelectProject={setSelectedProject}
              loading={loading}
              onRefresh={fetchProjects}
              onCreate={() => {
                setProjectModalItem(null);
                setProjectModalOpen(true);
              }}
            />
          </Col>

          <Col lg={9}>
            {detailLoading && (
              <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-3 text-muted">Loading project details...</p>
              </div>
            )}

            {!detailLoading && selectedProject && summary && (
              <>
                <SummaryMetrics metrics={summary.metrics} />
                <ProjectSummary
                  project={summary.project}
                  onEdit={() => {
                    setProjectModalItem(summary.project);
                    setProjectModalOpen(true);
                  }}
                  onRefresh={async () => {
                    await fetchProjects();
                    refreshDetails();
                  }}
                  onDelete={handleProjectDelete}
                />
                <DetailTabs
                  projectId={summary.project.id}
                  project={summary.project}
                  payments={summary.payments || []}
                  bugs={summary.bugs || []}
                  reports={summary.reports || []}
                  menus={summary.menus || []}
                  roles={summary.roles || []}
                  tables={summary.tables || []}
                  roleMenuAccess={summary.roleMenuAccess || []}
                  onRefresh={refreshDetails}
                  showAlert={showAlert}
                />
              </>
            )}

            {!detailLoading && (!selectedProject || !summary) && (
              <div className="text-center mt-5 pt-5">
                <i className="bx bx-layer display-1 text-muted"></i>
                <h4 className="mt-4 text-muted">
                  {loading
                    ? "Loading projects..."
                    : "Select a project to view details"}
                </h4>
              </div>
            )}
          </Col>
        </Row>
      </Container>

      <ProjectFormModal
        isOpen={projectModalOpen}
        toggle={() => {
          setProjectModalOpen((prev) => !prev);
          if (projectModalOpen) {
            setProjectModalItem(null);
          }
        }}
        onSubmit={handleProjectSave}
        onDelete={handleProjectDelete}
        editItem={projectModalItem}
      />
    </div>
  );
};

export default ProjectManagement;


