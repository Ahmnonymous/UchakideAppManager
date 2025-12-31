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
import { API_BASE_URL } from "../../../../helpers/url_helper";

const auditFields = (editItem) => {
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
    return { updated_by: username, updated_at: new Date().toISOString() };
  }
  return { created_by: username, created_at: new Date().toISOString() };
};

const RolesTab = ({ projectId, roles, onRefresh, showAlert }) => {
  const { isOrgExecutive } = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      role_name: "",
      notes: "",
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

  const [modulesRows, setModulesRows] = useState([]); // deprecated
  const [moduleDraft, setModuleDraft] = useState({ route: "" }); // deprecated
  const [editingModuleIndex, setEditingModuleIndex] = useState(null); // deprecated

  useEffect(() => {
    if (modalOpen) {
      reset({
        role_name: editItem?.role_name || "",
        notes: editItem?.notes || "",
      });
    }
  }, [modalOpen, editItem, reset]);

  const toggleModal = () => {
    setModalOpen((prev) => !prev);
    if (modalOpen) {
      setEditItem(null);
    }
  };

  const safeJSON = () => ({});

  const onSubmit = async (values) => {
    try {
      const payload = {
        project_id: projectId,
        role_name: values.role_name,
        notes: values.notes || null,
        ...auditFields(editItem),
      };

      if (editItem) {
        await axiosApi.put(
          `${API_BASE_URL}/appManager/roles/${editItem.id}`,
          payload,
        );
        showAlert("Roles has been updated successfully.");
      } else {
        await axiosApi.post(`${API_BASE_URL}/appManager/roles`, payload);
        showAlert("Roles has been created successfully.");
      }
      toggleModal();
      onRefresh();
    } catch (error) {
      console.error("Error saving role:", error);
      showAlert(error?.response?.data?.error || "Unable to save role", "danger");
    }
  };

  const handleDelete = (item, closeModal = false) => {
    showDeleteConfirmation(
      {
        id: item.id,
        name: item.role_name,
        type: "role",
        message: "This role will be removed from the project.",
      },
      async () => {
        await axiosApi.delete(`${API_BASE_URL}/appManager/roles/${item.id}`);
        showAlert("Roles has been deleted successfully.");
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
        header: "Role",
        accessorKey: "role_name",
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
        header: "Notes",
        accessorKey: "notes",
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
        <h5 className="mb-0">Roles</h5>
        <div className="d-flex align-items-center gap-2">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search roles..."
            style={{ width: 260, flex: "0 0 260px" }}
          />
          {!isOrgExecutive && (
            <Button color="primary" size="sm" style={{ flex: "0 0 auto" }} onClick={() => setModalOpen(true)}>
              <i className="bx bx-plus me-1" />
              Add Role
            </Button>
          )}
        </div>
      </div>

      {roles.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2" />
          No project roles defined yet. Click "Add Role" to map module access.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={(roles || []).filter((r) => {
            const t = searchTerm.toLowerCase();
            if (!t) return true;
            const composite = [r.role_name, r.notes, r.created_by, r.updated_by]
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
          {editItem ? "Edit Role" : "New Role"}
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label>
                    Role Name <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="role_name"
                    control={control}
                    rules={{ required: "Role name is required" }}
                    render={({ field }) => (
                      <Input
                        type="text"
                        invalid={!!errors.role_name}
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                  {errors.role_name && (
                    <FormFeedback>{errors.role_name.message}</FormFeedback>
                  )}
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <Label>Notes</Label>
              <Controller
                name="notes"
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
        title="Delete Role"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
      />
    </>
  );
};

export default React.memo(RolesTab);


