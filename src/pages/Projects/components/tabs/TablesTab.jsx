import React, { useCallback, useEffect, useMemo, useState } from "react";
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

const auditInfo = (editItem) => {
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

const buildEmptyFieldRow = () => ({
  field_name: "",
  data_type: "",
  constraints: "",
  default_value: "",
  description: "",
  example: "",
});

const defaultFieldDraft = () => ({
  field_name: "",
  data_type: "",
  constraints: "",
  default_value: "",
  description: "",
  example: "",
});

const TablesTab = ({ projectId, tables, onRefresh, showAlert }) => {
  const { isOrgExecutive } = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fieldRows, setFieldRows] = useState([]);
  const [fieldDraft, setFieldDraft] = useState(defaultFieldDraft());
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      table_name: "",
      found_at: "",
      parent_table: "",
      relationship_type: "",
      status: "In progress",
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
        table_name: editItem?.table_name || "",
        found_at: editItem?.found_at || "",
        parent_table: editItem?.parent_table || "",
        relationship_type: editItem?.relationship_type || "",
        status: editItem?.status || "In progress",
      });
      let parsedFields = [];
      if (editItem?.field_definitions) {
        try {
          const raw =
            typeof editItem.field_definitions === "string"
              ? JSON.parse(editItem.field_definitions)
              : editItem.field_definitions;
          if (Array.isArray(raw)) {
            parsedFields = raw.map((row) => ({
              field_name: row.field_name || "",
              data_type: row.data_type || "",
              constraints: row.constraints || "",
              default_value: row.default_value || "",
              description: row.description || "",
              example: row.example || "",
            }));
          }
        } catch (error) {
          parsedFields = [];
        }
      }
      setFieldRows(parsedFields);
      setFieldDraft(defaultFieldDraft());
      setEditingFieldIndex(null);
    }
  }, [modalOpen, editItem, reset]);

  const toggleModal = () => {
    setModalOpen((prev) => !prev);
    if (modalOpen) {
      setEditItem(null);
    }
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        project_id: projectId,
        table_name: values.table_name,
        found_at: values.found_at || null,
        parent_table: values.parent_table || null,
        relationship_type: values.relationship_type || null,
        status: values.status || "In progress",
        field_definitions: fieldRows
          .map((row) => ({
            field_name: row.field_name?.trim(),
            data_type: row.data_type?.trim(),
            constraints: row.constraints?.trim(),
            default_value: row.default_value?.trim(),
            description: row.description?.trim(),
            example: row.example?.trim(),
          }))
          .filter((row) => row.field_name),
        ...auditInfo(editItem),
      };

      if (editItem) {
        await axiosApi.put(
          `${API_BASE_URL}/appManager/tables/${editItem.id}`,
          payload,
        );
        showAlert("Tables has been updated successfully.");
      } else {
        await axiosApi.post(`${API_BASE_URL}/appManager/tables`, payload);
        showAlert("Tables has been created successfully.");
      }
      toggleModal();
      onRefresh();
    } catch (error) {
      console.error("Error saving table:", error);
      showAlert(
        error?.response?.data?.error || "Unable to save table metadata",
        "danger",
      );
    }
  };

  const handleMarkAsDone = useCallback(async (item) => {
    try {
      const payload = {
        project_id: projectId,
        table_name: item.table_name,
        found_at: item.found_at || null,
        parent_table: item.parent_table || null,
        relationship_type: item.relationship_type || null,
        status: "Done",
        field_definitions: item.field_definitions || [],
        ...auditInfo(true), // Pass truthy to get updated_by/updated_at
      };
      await axiosApi.put(
        `${API_BASE_URL}/appManager/tables/${item.id}`,
        payload,
      );
      showAlert("Table status updated to Done successfully.");
      onRefresh();
    } catch (error) {
      console.error("Error updating table status:", error);
      showAlert(
        error?.response?.data?.error || "Unable to update table status",
        "danger",
      );
    }
  }, [projectId, onRefresh, showAlert]);

  const handleDelete = (item, closeModal = false) => {
    showDeleteConfirmation(
      {
        id: item.id,
        name: item.table_name,
        type: "table",
        message: "This table metadata entry will be removed.",
      },
      async () => {
        await axiosApi.delete(`${API_BASE_URL}/appManager/tables/${item.id}`);
        showAlert("Tables has been deleted successfully.");
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
        header: "Table",
        accessorKey: "table_name",
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
        header: "Parent",
        accessorKey: "parent_table",
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Relationship",
        accessorKey: "relationship_type",
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Status",
        accessorKey: "status",
        enableColumnFilter: false,
        cell: (cell) => {
          const status = cell.getValue() || "In progress";
          const statusColors = {
            "In progress": "warning",
            "Done": "success",
            "In Review": "info",
          };
          const color = statusColors[status] || "secondary";
          return (
            <span className={`badge bg-${color}`}>
              {status}
            </span>
          );
        },
      },
      {
        header: "Action",
        enableColumnFilter: false,
        cell: (cell) => {
          const row = cell.row.original;
          const status = row.status || "In progress";
          const isDone = status === "Done";
          if (isDone || isOrgExecutive) {
            return null;
          }
          return (
            <Button
              color="success"
              size="sm"
              onClick={() => handleMarkAsDone(row)}
            >
              <i className="bx bx-check me-1" />
              Done
            </Button>
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
    [isOrgExecutive, handleMarkAsDone],
  );

  const handleFieldDraftChange = (key, value) => {
    setFieldDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddOrUpdateField = () => {
    if (!fieldDraft.field_name?.trim()) {
      showAlert("Field name is required to add a field", "warning");
      return;
    }

    const normalized = {
      field_name: fieldDraft.field_name.trim(),
      data_type: fieldDraft.data_type.trim(),
      constraints: fieldDraft.constraints.trim(),
      default_value: fieldDraft.default_value.trim(),
      description: fieldDraft.description.trim(),
      example: fieldDraft.example.trim(),
    };

    // Prevent duplicates by field_name (case-insensitive)
    const existsAt = fieldRows.findIndex(
      (r, idx) =>
        idx !== editingFieldIndex &&
        (r.field_name || "").trim().toLowerCase() ===
          normalized.field_name.toLowerCase(),
    );
    if (existsAt !== -1) {
      showAlert("This field is already added", "warning");
      return;
    }

    setFieldRows((rows) => {
      if (editingFieldIndex !== null) {
        return rows.map((row, idx) => (idx === editingFieldIndex ? normalized : row));
      }
      return [...rows, normalized];
    });

    setFieldDraft(defaultFieldDraft());
    setEditingFieldIndex(null);
  };

  const handleEditField = (index) => {
    setEditingFieldIndex(index);
    setFieldDraft(fieldRows[index]);
  };

  const handleRemoveField = (index) => {
    setFieldRows((rows) => rows.filter((_, idx) => idx !== index));
    if (editingFieldIndex === index) {
      setFieldDraft(defaultFieldDraft());
      setEditingFieldIndex(null);
    }
  };

  const filteredTables = useMemo(() => {
    if (!searchTerm) return tables;
    const q = searchTerm.toLowerCase();
    return tables.filter((t) => {
      const composite = [
        t.table_name,
        t.parent_table,
        t.relationship_type,
        t.found_at,
        t.status,
        t.created_by,
        t.updated_by,
      ]
        .map((x) => String(x || "").toLowerCase())
        .join(" ");
      return composite.includes(q);
    });
  }, [tables, searchTerm]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Tables</h5>
        <div className="d-flex align-items-center gap-2">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tables..."
            style={{ width: 260, flex: "0 0 260px" }}
          />
          {!isOrgExecutive && (
            <Button color="primary" size="sm" style={{ flex: "0 0 auto" }} onClick={() => setModalOpen(true)}>
              <i className="bx bx-plus me-1" />
              Add Table
            </Button>
          )}
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2" />
          No table metadata captured yet. Click "Add Table" to document your
          schema.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={filteredTables}
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
          {editItem ? "Edit Table Metadata" : "Add Table Metadata"}
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    Table Name <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="table_name"
                    control={control}
                    rules={{ required: "Table name is required" }}
                    render={({ field }) => (
                      <Input
                        type="text"
                        invalid={!!errors.table_name}
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                  {errors.table_name && (
                    <FormFeedback>{errors.table_name.message}</FormFeedback>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Found At</Label>
                  <Controller
                    name="found_at"
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
                  <Label>Parent Table</Label>
                  <Controller
                    name="parent_table"
                    control={control}
                    render={({ field }) => {
                      const currentName = editItem?.table_name || "";
                      const options = Array.isArray(tables) ? tables : [];
                      return (
                        <Input
                          type="select"
                          disabled={isOrgExecutive}
                          {...field}
                        >
                          <option value="">None</option>
                          {options
                            .filter((t) => (t.table_name || "") !== currentName)
                            .map((t) => (
                              <option key={t.id} value={t.table_name || ""}>
                                {t.table_name || "-"}
                              </option>
                            ))}
                        </Input>
                      );
                    }}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Relationship Type</Label>
                  <Controller
                    name="relationship_type"
                    control={control}
                    render={({ field }) => (
                      <Input type="select" disabled={isOrgExecutive} {...field}>
                        <option value="">None</option>
                        <option value="One-to-Many">One-to-Many</option>
                        <option value="Many-to-Many">Many-to-Many</option>
                        <option value="Lookup">Lookup</option>
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>Status</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Input type="select" disabled={isOrgExecutive} {...field}>
                        <option value="In progress">In progress</option>
                        <option value="Done">Done</option>
                        <option value="In Review">In Review</option>
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <Label>Fields</Label>
              <div className="border rounded p-3 bg-light mb-3">
                <Row>
                  <Col md={4}>
                    <FormGroup>
                      <Label>
                        Field Name <span className="text-danger">*</span>
                      </Label>
                      <Input
                        type="text"
                        value={fieldDraft.field_name}
                        disabled={isOrgExecutive}
                        onChange={(e) =>
                          handleFieldDraftChange("field_name", e.target.value)
                        }
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Data Type</Label>
                      <Input
                        type="select"
                        value={fieldDraft.data_type}
                        disabled={isOrgExecutive}
                        onChange={(e) =>
                          handleFieldDraftChange("data_type", e.target.value)
                        }
                      >
                        <option value="">Select type</option>
                        <option value="text">Text / Varchar</option>
                        <option value="number">Number / Integer</option>
                        <option value="decimal">Decimal</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                        <option value="datetime">DateTime / Timestamp</option>
                        <option value="json">JSON</option>
                        <option value="lookup">Lookup / Reference</option>
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Constraints / Validation</Label>
                      <Input
                        type="text"
                        value={fieldDraft.constraints}
                        disabled={isOrgExecutive}
                        onChange={(e) =>
                          handleFieldDraftChange("constraints", e.target.value)
                        }
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Default Value</Label>
                      <Input
                        type="text"
                        value={fieldDraft.default_value}
                        disabled={isOrgExecutive}
                        onChange={(e) =>
                          handleFieldDraftChange("default_value", e.target.value)
                        }
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Description / Notes</Label>
                      <Input
                        type="text"
                        value={fieldDraft.description}
                        disabled={isOrgExecutive}
                        onChange={(e) =>
                          handleFieldDraftChange("description", e.target.value)
                        }
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Example / Sample Data</Label>
                      <Input
                        type="text"
                        value={fieldDraft.example}
                        disabled={isOrgExecutive}
                        onChange={(e) =>
                          handleFieldDraftChange("example", e.target.value)
                        }
                      />
                    </FormGroup>
                  </Col>
                </Row>
                {!isOrgExecutive && (
                  <div className="d-flex gap-2">
                    <Button color="primary" size="sm" onClick={handleAddOrUpdateField}>
                      <i className="bx bx-save me-1" />
                      {editingFieldIndex !== null ? "Update Field" : "Add Field"}
                    </Button>
                    {editingFieldIndex !== null && (
                      <Button
                        color="light"
                        size="sm"
                        onClick={() => {
                          setEditingFieldIndex(null);
                          setFieldDraft(defaultFieldDraft());
                        }}
                      >
                        <i className="bx bx-reset me-1" />
                        Reset
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {fieldRows.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Field Name</th>
                        <th>Data Type</th>
                        <th>Constraints</th>
                        <th>Default</th>
                        <th>Description</th>
                        <th>Example</th>
                        {!isOrgExecutive && <th style={{ width: 80 }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {fieldRows.map((row, index) => (
                        <tr key={`field-summary-${index}`}>
                          <td>
                            <button
                              type="button"
                              className="btn btn-link p-0 text-primary fw-semibold"
                              onClick={() => handleEditField(index)}
                            >
                              {row.field_name || "-"}
                            </button>
                          </td>
                          <td>{row.data_type || "-"}</td>
                          <td>{row.constraints || "-"}</td>
                          <td>{row.default_value || "-"}</td>
                          <td>{row.description || "-"}</td>
                          <td>{row.example || "-"}</td>
                          {!isOrgExecutive && (
                            <td className="text-center">
                              <Button
                                color="danger"
                                size="sm"
                                onClick={() => handleRemoveField(index)}
                              >
                                <i className="bx bx-trash" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info mb-0" role="alert">
                  <i className="bx bx-info-circle me-2" />
                  No fields added yet. Use the form above to add fields to this table.
                </div>
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
        title="Delete Table Metadata"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
      />
    </>
  );
};

export default React.memo(TablesTab);


