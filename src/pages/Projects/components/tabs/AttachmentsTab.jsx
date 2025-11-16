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
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import TableContainer from "../../../../components/Common/TableContainer";
import DeleteConfirmationModal from "../../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../../hooks/useDeleteConfirmation";
import { useRole } from "../../../../helpers/useRole";
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL } from "../../../../helpers/url_helper";

const buildAuditFields = (editItem) => {
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

const AttachmentsTab = ({ projectId, attachments, onRefresh, showAlert }) => {
  const { isOrgExecutive } = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [fileRef, setFileRef] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      file_name: "",
      file_description: "",
      category: "Project",
      link_to_project_task_report: "",
    },
  });

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
        file_name: editItem?.file_name || "",
        file_description: editItem?.file_description || "",
        category: editItem?.category || "Project",
        link_to_project_task_report: editItem?.link_to_project_task_report || "",
      });
      setFileRef(null);
    }
  }, [modalOpen, editItem, reset]);

  const toggleModal = () => {
    setModalOpen((prev) => !prev);
    if (modalOpen) {
      setEditItem(null);
      setFileRef(null);
    }
  };

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append("project_id", projectId);
      formData.append("file_name", values.file_name);
      if (values.file_description) {
        formData.append("file_description", values.file_description);
      }
      formData.append("category", values.category || "Project");
      if (values.link_to_project_task_report) {
        formData.append(
          "link_to_project_task_report",
          values.link_to_project_task_report,
        );
      }
      const file = fileRef;
      if (file) {
        formData.append("file", file);
      }
      const auditFields = buildAuditFields(editItem);
      Object.entries(auditFields).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (editItem) {
        await axiosApi.put(
          `${API_BASE_URL}/appManager/attachments/${editItem.id}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        showAlert("Attachment updated");
      } else {
        await axiosApi.post(`${API_BASE_URL}/appManager/attachments`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showAlert("Attachment uploaded");
      }
      toggleModal();
      onRefresh();
    } catch (error) {
      console.error("Error saving attachment:", error);
      showAlert(
        error?.response?.data?.error || "Unable to save attachment",
        "danger",
      );
    }
  };

  const handleDelete = (item, closeModal = false) => {
    showDeleteConfirmation(
      {
        id: item.id,
        name: item.file_name,
        type: "attachment",
        message: "This attachment will be permanently removed.",
      },
      async () => {
        await axiosApi.delete(
          `${API_BASE_URL}/appManager/attachments/${item.id}`,
        );
        showAlert("Attachment deleted");
        onRefresh();
        if (closeModal) {
          setModalOpen(false);
          setEditItem(null);
        }
      },
    );
  };

  const formatDateValue = (value) =>
    value ? new Date(value).toLocaleDateString() : "-";

  const columns = useMemo(
    () => [
      {
        header: "File Name",
        accessorKey: "file_name",
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
        header: "Category",
        accessorKey: "category",
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Linked Item",
        accessorKey: "link_to_project_task_report",
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
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
        <h5 className="mb-0">Attachments</h5>
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={() => setModalOpen(true)}>
            <i className="bx bx-upload me-1" />
            Upload File
          </Button>
        )}
      </div>

      {attachments.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2" />
          No attachments uploaded yet. Click "Upload File" to add supporting
          documents.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={attachments}
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
          {editItem ? "Edit Attachment" : "Upload Attachment"}
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    File Name <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="file_name"
                    control={control}
                    rules={{ required: "File name is required" }}
                    render={({ field }) => (
                      <Input
                        type="text"
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Category</Label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Input type="select" disabled={isOrgExecutive} {...field}>
                        <option value="Project">Project</option>
                        <option value="Bug">Bug</option>
                        <option value="Report">Report</option>
                        <option value="Finance">Finance</option>
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label>Linked Item (Task / Report / Bug)</Label>
                  <Controller
                    name="link_to_project_task_report"
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
                name="file_description"
                control={control}
                render={({ field }) => (
                  <Input
                    type="textarea"
                    rows="3"
                    disabled={isOrgExecutive}
                    {...field}
                  />
                )}
              />
            </FormGroup>
            <FormGroup>
              <Label>{editItem ? "Replace File (optional)" : "File Upload"}</Label>
              <Input
                type="file"
                disabled={isOrgExecutive}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setFileRef(file || null);
                  if (file) {
                    setValue("file_name", file.name, { shouldValidate: true });
                  }
                }}
              />
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
        title="Delete Attachment"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
      />
    </>
  );
};

export default AttachmentsTab;


