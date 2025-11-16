import React from "react";
import { Card, CardBody, Row, Col, Button } from "reactstrap";
import DeleteConfirmationModal from "../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../hooks/useDeleteConfirmation";
import { useRole } from "../../../helpers/useRole";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return "-";
  const amount = Number(value);
  if (Number.isNaN(amount)) return "-";
  return `$ ${amount.toFixed(2)}`;
};

const ProjectSummary = ({ project, onEdit, onRefresh, onDelete }) => {
  const { isOrgExecutive } = useRole();
  const {
    deleteModalOpen,
    deleteItem,
    deleteLoading,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    confirmDelete,
  } = useDeleteConfirmation();

  const handleDelete = () => {
    showDeleteConfirmation(
      {
        id: project.id,
        name: project.project_name,
        type: "project",
        message:
          "Deleting this project will remove all related payments, bugs, reports, roles, and tables.",
      },
      async () => {
        await onDelete(project.id);
        onRefresh();
      },
    );
  };

const renderField = (label, value, span = 3) => (
  <Col md={span} className="mb-3">
    <p className="text-muted mb-1 font-size-11 text-uppercase">{label}</p>
    <p
      className="mb-0 fw-medium font-size-12 text-truncate"
      title={value || "-"}
      style={{ maxWidth: "100%" }}
    >
      {value || "-"}
    </p>
  </Col>
);

const renderLinkField = (label, value, span = 3) => {
  const href = value ? `https://${value.replace(/^https?:\/\//i, "")}` : null;
  return (
    <Col md={span} className="mb-3">
      <p className="text-muted mb-1 font-size-11 text-uppercase">{label}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="fw-medium font-size-12 text-truncate d-inline-block"
          title={value}
          style={{ maxWidth: "100%" }}
        >
          {value}
        </a>
      ) : (
        <p className="mb-0 fw-medium font-size-12">-</p>
      )}
    </Col>
  );
};

  return (
    <>
      <Card className="border shadow-sm mb-3">
        <div className="card-header bg-transparent border-bottom py-3">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="card-title mb-0 fw-semibold font-size-16">
              <i className="bx bx-layout me-2 text-primary" />
              Project Summary
            </h5>
            <div className="d-flex gap-2">
              {!isOrgExecutive && (
                <>
                  <Button color="primary" size="sm" onClick={onEdit}>
                    <i className="bx bx-edit-alt me-1" />
                    Edit
                  </Button>
                  {/* <Button
                    color="danger"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteLoading}
                  >
                    <i className="bx bx-trash me-1" />
                    Delete
                  </Button> */}
                </>
              )}
            </div>
          </div>
        </div>
        <CardBody className="py-3">
          <Row>
            {renderField("Project Name", project.project_name)}
            {renderField("Description", project.description)}
            {renderField("Status", project.project_status)}
            {renderField("User Type", project.user_type)}
          </Row>
          <Row>
            {renderField("Developer", project.developer_assigned)}
            {renderField("Start Date", formatDate(project.start_date))}
            {renderField("End Date", formatDate(project.end_date))}
            {renderField("Time (weeks)", project.time_weeks)}
          </Row>
          <Row>
            {renderField("Project Cost (USD)", formatCurrency(project.project_cost))}
            {renderLinkField("Template", project.template)}
            {renderLinkField("Figma Link", project.figma_link)}
            {renderLinkField("URL", project.url)}
          </Row>
          <Row className="align-items-center">
            {renderField("Created By", project.created_by)}
            {renderField("Created At", formatDate(project.created_at))}
            {renderField("Updated By", project.updated_by)}
            {renderField("Updated At", formatDate(project.updated_at))}
          </Row>
        </CardBody>
      </Card>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        toggle={hideDeleteConfirmation}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Project"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
      />
    </>
  );
};

export default ProjectSummary;


