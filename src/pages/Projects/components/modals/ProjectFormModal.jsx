import React, { useEffect } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Row,
  Col,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Button,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import { useRole } from "../../../../helpers/useRole";

const buildAuditPayload = (editItem) => {
  let currentUser;
  try {
    currentUser =
      JSON.parse(localStorage.getItem("authUser")) ||
      JSON.parse(localStorage.getItem("currentUser")) ||
      JSON.parse(localStorage.getItem("user")) ||
      {};
  } catch (e) {
    currentUser = {};
  }
  const username = currentUser?.username || currentUser?.name || "system";
  if (editItem) {
    return {
      updated_by: username,
      updated_at: new Date().toISOString(),
    };
  }
  return {
    created_by: username,
    created_at: new Date().toISOString(),
  };
};

const formatDateToMMDDYYYY = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const parseDateToISO = (value) => {
  if (!value) return null;
  const parts = value.split(/[/\-]/).map((part) => part.trim());
  if (parts.length !== 3) {
    return null;
  }
  const [month, day, year] =
    parts[0].length === 4 ? [parts[1], parts[2], parts[0]] : parts;
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const yyyy = year.length === 2 ? `20${year}` : year;
  const iso = `${yyyy}-${mm}-${dd}`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : iso;
};

const sanitizeLink = (value) => {
  if (!value) return null;
  let cleaned = value.trim();
  cleaned = cleaned.replace(/^https?:\/\//i, "");
  cleaned = cleaned.replace(/^www\./i, "");
  return cleaned || null;
};

const ProjectFormModal = ({ isOpen, toggle, onSubmit, onDelete, editItem }) => {
  const { isOrgExecutive } = useRole();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      project_name: "",
      description: "",
      user_type: "",
      start_date: "",
      end_date: "",
      url: "",
      developer_assigned: "",
      figma_link: "",
      template: "",
      project_status: "Planned",
      project_cost: "",
      time_weeks: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        project_name: editItem?.project_name || "",
        description: editItem?.description || "",
        user_type: editItem?.user_type || "",
        start_date: formatDateToMMDDYYYY(editItem?.start_date),
        end_date: formatDateToMMDDYYYY(editItem?.end_date),
        url: editItem?.url || "",
        developer_assigned: editItem?.developer_assigned || "",
        figma_link: editItem?.figma_link || "",
        template: editItem?.template || "",
        project_status: editItem?.project_status || "Planned",
        project_cost: editItem?.project_cost || "",
        time_weeks: editItem?.time_weeks || "",
      });
    }
  }, [isOpen, editItem, reset]);

  const submitForm = async (values) => {
    const payload = {
      project_name: values.project_name,
      description: values.description || null,
      user_type: values.user_type || null,
      start_date: parseDateToISO(values.start_date),
      end_date: parseDateToISO(values.end_date),
      url: values.url || null,
      developer_assigned: values.developer_assigned || null,
      figma_link: values.figma_link || null,
      template: values.template || null,
      project_status: values.project_status || "Planned",
      project_cost: values.project_cost
        ? Number(values.project_cost)
        : null,
      time_weeks: values.time_weeks ? Number(values.time_weeks) : null,
      ...buildAuditPayload(editItem),
    };
    await onSubmit(payload, editItem);
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" centered backdrop="static">
      <ModalHeader toggle={toggle}>
        {editItem ? "Edit Project" : "New Project"}
      </ModalHeader>
      <Form onSubmit={handleSubmit(submitForm)}>
        <ModalBody>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label>
                  Project Name <span className="text-danger">*</span>
                </Label>
                <Controller
                  name="project_name"
                  control={control}
                  rules={{ required: "Project name is required" }}
                  render={({ field }) => (
                    <Input
                      type="text"
                      invalid={!!errors.project_name}
                      disabled={isOrgExecutive}
                      {...field}
                    />
                  )}
                />
                {errors.project_name && (
                  <FormFeedback>{errors.project_name.message}</FormFeedback>
                )}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>Status</Label>
                <Controller
                  name="project_status"
                  control={control}
                  render={({ field }) => (
                    <Input type="select" disabled={isOrgExecutive} {...field}>
                      <option value="Planned">Planned</option>
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </Input>
                  )}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label>User Type</Label>
                <Controller
                  name="user_type"
                  control={control}
                  render={({ field }) => (
                    <Input type="select" disabled={isOrgExecutive} {...field}>
                      <option value="">Select Type</option>
                      <option value="Self Creation">Self Creation</option>
                      <option value="Employee Creation">Employee Creation</option>
                    </Input>
                  )}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>Developer Assigned</Label>
                <Controller
                  name="developer_assigned"
                  control={control}
                  render={({ field }) => (
                    <Input type="text" disabled={isOrgExecutive} {...field} />
                  )}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label>Start Date</Label>
                <Controller
                  name="start_date"
                  control={control}
                  render={({ field }) => (
                      <Input
                        type="text"
                        placeholder="MM/DD/YYYY"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                  )}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>End Date</Label>
                <Controller
                  name="end_date"
                  control={control}
                  render={({ field }) => (
                      <Input
                        type="text"
                        placeholder="MM/DD/YYYY"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                  )}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
              <Label>Project Cost (USD)</Label>
                <Controller
                  name="project_cost"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      step="0.01"
                      disabled={isOrgExecutive}
                      {...field}
                    />
                  )}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>Time (weeks)</Label>
                <Controller
                  name="time_weeks"
                  control={control}
                  render={({ field }) => (
                    <Input type="number" disabled={isOrgExecutive} {...field} />
                  )}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label>Project URL</Label>
                <Controller
                  name="url"
                  control={control}
                  render={({ field }) => (
                    <Input type="text" disabled={isOrgExecutive} {...field} />
                  )}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>Figma Link</Label>
                <Controller
                  name="figma_link"
                  control={control}
                  render={({ field }) => (
                    <Input type="text" disabled={isOrgExecutive} {...field} />
                  )}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label>Template</Label>
                <Controller
                  name="template"
                  control={control}
                  render={({ field }) => (
                    <Input type="text" disabled={isOrgExecutive} {...field} />
                  )}
                />
              </FormGroup>
            </Col>
          </Row>
          <FormGroup>
            <Label>Description</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input
                  type="textarea"
                  rows="4"
                  disabled={isOrgExecutive}
                  {...field}
                />
              )}
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter className="d-flex justify-content-between">
          <div>
            {editItem && !isOrgExecutive && onDelete && (
              <Button
                color="danger"
                type="button"
                onClick={() => onDelete(editItem.id)}
                disabled={isSubmitting}
              >
                <i className="bx bx-trash me-1" />
                Delete
              </Button>
            )}
          </div>
          <div className="d-flex gap-2">
            <Button color="light" onClick={toggle} disabled={isSubmitting}>
              <i className="bx bx-x me-1" />
              Cancel
            </Button>
            {!isOrgExecutive && (
              <Button color="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bx bx-save me-1" />
                    Save
                  </>
                )}
              </Button>
            )}
          </div>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default ProjectFormModal;


