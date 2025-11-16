import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
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
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import TableContainer from "../../../../components/Common/TableContainer";
import DeleteConfirmationModal from "../../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../../hooks/useDeleteConfirmation";
import { useRole } from "../../../../helpers/useRole";
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL, API_STREAM_BASE_URL } from "../../../../helpers/url_helper";

const enrichAudit = (editItem) => {
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

const BugsTab = ({ projectId, bugs, menus = [], onRefresh, showAlert }) => {
  const { isOrgExecutive } = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      type: "",
      description: "",
      page: "",
      priority: "Medium",
      status: "Open",
      source: "Internal",
      reported_by: "",
    },
  });

  const formatDateValue = (value) =>
    value ? new Date(value).toLocaleDateString() : "-";

  const {
    deleteModalOpen,
    deleteItem,
    deleteLoading,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    confirmDelete,
  } = useDeleteConfirmation();

  useEffect(() => {
    if (modalOpen) {
      reset({
        type: editItem?.type || "",
        description: editItem?.description || "",
        page: editItem?.menu_id
          ? String(editItem.menu_id)
          : "",
        priority: editItem?.priority || "Medium",
        status: editItem?.status || "Open",
        source: editItem?.source || "Internal",
        reported_by: editItem?.reported_by || "",
      });
      setAttachmentFile(null);
    }
  }, [modalOpen, editItem, reset]);

  const toggleModal = () => {
    setModalOpen((prev) => !prev);
    if (modalOpen) {
      setEditItem(null);
      setAttachmentFile(null);
    }
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result?.toString() || "";
        const base64 = result.includes(",") ? result.split(",").pop() : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const sourceValue = watch("source");

  const onSubmit = async (values) => {
    try {
      let attachmentPayload = {};
      if (attachmentFile) {
        const base64 = await fileToBase64(attachmentFile);
        attachmentPayload = {
          attachment_base64: base64,
          attachment_filename: attachmentFile.name,
          attachment_mime: attachmentFile.type || "application/octet-stream",
          attachment_size: attachmentFile.size || 0,
        };
      }
      const payload = {
        project_id: projectId,
        type: values.type,
        description: values.description,
        menu_id: values.page ? Number(values.page) : null,
        priority: values.priority,
        status: values.status,
        source: values.source,
        reported_by: values.reported_by || null,
        ...enrichAudit(editItem),
        ...attachmentPayload,
      };

      if (editItem) {
        await axiosApi.put(
          `${API_BASE_URL}/appManager/bugs/${editItem.id}`,
          payload,
        );
        showAlert("Bugs & Tasks has been updated successfully.");
      } else {
        await axiosApi.post(`${API_BASE_URL}/appManager/bugs`, payload);
        showAlert("Bugs & Tasks has been created successfully.");
      }
      toggleModal();
      onRefresh();
    } catch (error) {
      console.error("Error saving bug:", error);
      showAlert(error?.response?.data?.error || "Unable to save bug", "danger");
    }
  };

  const handleDelete = (item, closeModal = false) => {
    showDeleteConfirmation(
      {
        id: item.id,
        name: item.type,
        type: "bug",
        message: "This bug/task will be permanently removed.",
      },
      async () => {
        await axiosApi.delete(`${API_BASE_URL}/appManager/bugs/${item.id}`);
        showAlert("Bugs & Tasks has been deleted successfully.");
        onRefresh();
        if (closeModal) {
          setModalOpen(false);
          setEditItem(null);
        }
      },
    );
  };

  const columns = useMemo(
    () => [
      {
        header: "Type",
        accessorKey: "type",
        enableColumnFilter: false,
        cell: (cell) => {
          const row = cell.row.original;
          const value = cell.getValue() || "-";
          return (
            <button
              type="button"
              className="btn btn-link p-0 fw-semibold text-primary"
              onClick={() => {
                setEditItem(row);
                setModalOpen(true);
              }}
            >
              {value}
            </button>
          );
        },
      },
      {
        header: "Priority",
        accessorKey: "priority",
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Status",
        accessorKey: "status",
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Page",
        accessorKey: "menu_name",
        enableColumnFilter: false,
        cell: (cell) => {
          const val = cell.getValue();
          const raw = cell.row.original?.page;
          return val || raw || "-";
        },
      },
      {
        header: "Attachment",
        accessorKey: "attachment_filename",
        enableColumnFilter: false,
        cell: (cell) => {
          const row = cell.row.original;
          if (!row.attachment_filename || !(row.attachment_mime || "").toLowerCase().startsWith("image/")) return "-";
          return (
            <button
              type="button"
              className="btn btn-link p-0 text-primary"
              title="View attachment"
              onClick={() => {
                const url = `${API_STREAM_BASE_URL}/appManager/bugs/${row.id}/attachment?t=${Date.now()}`;
                window.open(url, "_blank", "noopener");
              }}
            >
              <i className="bx bx-show" /> View
            </button>
          );
        },
      },
      {
        header: "Created By",
        accessorKey: "created_by",
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Created At",
        accessorKey: "created_at",
        enableColumnFilter: false,
        cell: (cell) => formatDateValue(cell.getValue()),
      },
      {
        header: "Updated By",
        accessorKey: "updated_by",
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Updated At",
        accessorKey: "updated_at",
        enableColumnFilter: false,
        cell: (cell) => formatDateValue(cell.getValue()),
      },
    ],
    [],
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Bugs & Tasks</h5>
        <div className="d-flex align-items-center gap-2">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search bugs & tasks..."
            style={{ width: 260, flex: "0 0 260px" }}
          />
          {!isOrgExecutive && (
            <Button color="primary" size="sm" style={{ flex: "0 0 auto" }} onClick={() => setModalOpen(true)}>
              <i className="bx bx-plus me-1" />
              Log Bug
            </Button>
          )}
        </div>
      </div>

      {bugs.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2" />
          No bugs or tasks logged yet. Use "Log Bug" to capture one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={bugs.filter((b) => {
            const t = searchTerm.toLowerCase();
            if (!t) return true;
            const composite = [
              b.type,
              b.priority,
              b.status,
              b.page,
              b.menu_name,
              b.source,
              b.reported_by,
              b.description,
              b.created_by,
              b.updated_by,
            ]
              .map((x) => String(x || "").toLowerCase())
              .join(" ");
            return composite.includes(t);
          })}
          isGlobalFilter={false}
          isPagination={true}
          isCustomPageSize={true}
          pagination="pagination"
          paginationWrapper="dataTables_paginate paging_simple_numbers"
          tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
        />
      )}

      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="lg" backdrop="static">
        <ModalHeader toggle={toggleModal}>
          {editItem ? "Edit Bug / Task" : "Log Bug / Task"}
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    Type <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="type"
                    control={control}
                    rules={{ required: "Type is required" }}
                    render={({ field }) => (
                      <Input
                        type="select"
                        invalid={!!errors.type}
                        disabled={isOrgExecutive}
                        {...field}
                      >
                        <option value="">Select type</option>
                        <option value="Task">Task</option>
                        <option value="Bug">Bug</option>
                      </Input>
                    )}
                  />
                  {errors.type && <FormFeedback>{errors.type.message}</FormFeedback>}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Menu Name</Label>
                  <Controller
                    name="page"
                    control={control}
                    render={({ field }) => (
                      <Input type="select" disabled={isOrgExecutive} {...field}>
                        <option value="">Select page</option>
                        {(menus || []).map((m) => (
                          <option key={m.id} value={String(m.id)}>
                            {m.menu_name || "-"}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <FormGroup>
                  <Label>Priority</Label>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <Input type="select" disabled={isOrgExecutive} {...field}>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label>Status</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Input type="select" disabled={isOrgExecutive} {...field}>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Blocked">Blocked</option>
                        <option value="In Review">In Review</option>
                        <option value="Done">Done</option>
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label>Source</Label>
                  <Controller
                    name="source"
                    control={control}
                    render={({ field }) => (
                      <Input type="select" disabled={isOrgExecutive} {...field}>
                        <option value="Internal">Internal</option>
                        <option value="Client">Client</option>
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>
            </Row>
            {sourceValue === "Client" && (
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label>Reported By (Client Name)</Label>
                    <Controller
                      name="reported_by"
                      control={control}
                      render={({ field }) => (
                        <Input type="text" disabled={isOrgExecutive} {...field} />
                      )}
                    />
                  </FormGroup>
                </Col>
              </Row>
            )}
            <FormGroup>
              <Label>Attachment</Label>
              <Input
                type="file"
                accept="image/*"
                disabled={isOrgExecutive}
                onChange={(event) => {
                  const f = event.target.files?.[0] || null;
                  if (f && !(String(f.type || "").toLowerCase().startsWith("image/"))) {
                    showAlert && showAlert("Only image files are allowed", "warning");
                    event.target.value = "";
                    setAttachmentFile(null);
                    return;
                  }
                  setAttachmentFile(f);
                }}
              />
              {editItem?.attachment_filename && (
                <div className="mt-2 p-2 border rounded bg-light">
                  <div className="d-flex align-items-center">
                    <i className="bx bx-file font-size-24 text-primary me-2"></i>
                    <div className="flex-grow-1">
                      <div className="fw-medium">{editItem.attachment_filename}</div>
                      <small className="text-muted">
                        {formatFileSize(editItem.attachment_size)} • Current file
                      </small>
                    </div>
                  </div>
                </div>
              )}
              {attachmentFile && (
                <div className="mt-2 text-muted small">
                  Ready to upload: {attachmentFile.name} (
                  {formatFileSize(attachmentFile.size)})
                </div>
              )}
            </FormGroup>
            <FormGroup>
              <Label>
                Description <span className="text-danger">*</span>
              </Label>
              <Controller
                name="description"
                control={control}
                rules={{ required: "Description is required" }}
                render={({ field }) => (
                  <Input
                    type="textarea"
                    rows="4"
                    invalid={!!errors.description}
                    disabled={isOrgExecutive}
                    {...field}
                  />
                )}
              />
              {errors.description && (
                <FormFeedback>{errors.description.message}</FormFeedback>
              )}
            </FormGroup>
          </ModalBody>
          <ModalFooter className="d-flex justify-content-between">
            <div>
              {editItem && !isOrgExecutive && (
                <Button
                  color="danger"
                  type="button"
                  onClick={() => handleDelete(editItem, true)}
                  disabled={isSubmitting}
                >
                  <i className="bx bx-trash me-1" />
                  Delete
                </Button>
              )}
            </div>
            <div className="d-flex gap-2">
              <Button color="light" onClick={toggleModal} disabled={isSubmitting}>
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



      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        toggle={hideDeleteConfirmation}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Bug"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
      />
    </>
  );
};

export default BugsTab;


