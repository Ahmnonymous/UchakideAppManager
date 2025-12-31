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

const withAudit = (editItem) => {
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

const ReportsTab = ({ projectId, reports, tables = [], onRefresh, showAlert }) => {
  const { isOrgExecutive } = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const formatDateValue = (value) =>
    value ? new Date(value).toLocaleDateString() : "-";

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      report_name: "",
      description: "",
      fields_displayed: "",
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

  const [fieldRows, setFieldRows] = useState([]);
  const [fieldDraft, setFieldDraft] = useState({ table_name: "", column_name: "", description: "" });
  const [availableColumns, setAvailableColumns] = useState([]);
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);

  const getColumnsForTable = (tableName) => {
    if (!tableName) return [];
    const t = (tables || []).find(
      (x) => String(x.table_name || "") === String(tableName || ""),
    );
    if (!t) return [];
    const raw = t.field_definitions;
    try {
      const arr = Array.isArray(raw) ? raw : JSON.parse(typeof raw === "string" ? raw : "[]");
      return Array.isArray(arr)
        ? arr.map((r) => r?.field_name || r?.name || "").filter(Boolean)
        : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (modalOpen) {
      reset({
        report_name: editItem?.report_name || "",
        description: editItem?.description || "",
        fields_displayed: "",
        status: editItem?.status || "In progress",
      });
      // hydrate builder rows from editItem.fields_displayed
      let rows = [];
      const raw = editItem?.fields_displayed;
      if (raw) {
        try {
          const arr = Array.isArray(raw) ? raw : JSON.parse(typeof raw === "string" ? raw : "[]");
          if (Array.isArray(arr)) {
            rows = arr.map((r) => ({
              table_name: r.table_name || r.table || "",
              column_name: r.column_name || r.name || "",
              description: r.description || r.notes || "",
            }));
          }
        } catch {
          rows = [];
        }
      }
      setFieldRows(rows);
      setFieldDraft({ table_name: "", column_name: "", description: "" });
      setAvailableColumns([]);
      setEditingFieldIndex(null);
    }
  }, [modalOpen, editItem, reset]);

  const toggleModal = () => {
    setModalOpen((prev) => !prev);
    if (modalOpen) {
      setEditItem(null);
    }
  };

  const safeJSONParse = (value, fallback) => fallback;

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        project_id: projectId,
        report_name: values.report_name,
        description: values.description || null,
        status: values.status || "In progress",
        fields_displayed: fieldRows.map((r) => ({
          table_name: r.table_name?.trim() || "",
          column_name: r.column_name?.trim() || "",
          description: r.description?.trim() || "",
        })),
        ...withAudit(editItem),
      };

      if (editItem) {
        await axiosApi.put(
          `${API_BASE_URL}/appManager/reports/${editItem.id}`,
          payload,
        );
        showAlert("Reports has been updated successfully.");
      } else {
        await axiosApi.post(`${API_BASE_URL}/appManager/reports`, payload);
        showAlert("Reports has been created successfully.");
      }
      toggleModal();
      onRefresh();
    } catch (error) {
      console.error("Error saving report:", error);
      showAlert(
        error?.response?.data?.error || "Unable to save report",
        "danger",
      );
    }
  };

  const handleDelete = (item) => {
    showDeleteConfirmation(
      {
        id: item.id,
        name: item.report_name,
        type: "report",
        message: "This report definition will be removed.",
      },
      async () => {
        await axiosApi.delete(`${API_BASE_URL}/appManager/reports/${item.id}`);
        showAlert("Reports has been deleted successfully.");
        onRefresh();
        setModalOpen(false);
        setEditItem(null);
      },
    );
  };

  const columns = useMemo(
    () => [
      {
        header: "Report Name",
        accessorKey: "report_name",
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
        header: "Description",
        accessorKey: "description",
        enableColumnFilter: false,
        cell: (cell) => {
          const value = cell.getValue() || "";
          if (!value) return "-";
          const truncated = value.length > 50 ? `${value.substring(0, 50)}...` : value;
          return (
            <span title={value.length > 50 ? value : undefined}>
              {truncated}
            </span>
          );
        },
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
        <h5 className="mb-0">Reports</h5>
        <div className="d-flex align-items-center gap-2">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reports..."
            style={{ width: 260, flex: "0 0 260px" }}
          />
          {!isOrgExecutive && (
            <Button color="primary" size="sm" style={{ flex: "0 0 auto" }} onClick={() => setModalOpen(true)}>
              <i className="bx bx-plus me-1" />
              Add Report
            </Button>
          )}
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2" />
          No reports configured yet. Click "Add Report" to start documenting one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={reports.filter((r) => {
            const t = searchTerm.toLowerCase();
            if (!t) return true;
            const composite = [
              r.report_name,
              r.description,
              r.status,
              r.created_by,
              r.updated_by,
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
          {editItem ? "Edit Report" : "New Report"}
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label>
                    Report Name <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="report_name"
                    control={control}
                    rules={{ required: "Report name is required" }}
                    render={({ field }) => (
                      <Input
                        type="text"
                        invalid={!!errors.report_name}
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                  {errors.report_name && (
                    <FormFeedback>{errors.report_name.message}</FormFeedback>
                  )}
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
                    rows="3"
                    disabled={isOrgExecutive}
                    {...field}
                  />
                )}
              />
            </FormGroup>
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
              <Label>Report Fields Display</Label>
              <div className="border rounded p-3 bg-light mb-3">
                <Row>
                  <Col md={4}>
                    <FormGroup>
                      <Label>
                        Related Table <span className="text-danger">*</span>
                      </Label>
                      <Input
                        type="select"
                        value={fieldDraft.table_name}
                        disabled={isOrgExecutive}
                        onChange={(e) => {
                          const table_name = e.target.value;
                          setFieldDraft((d) => ({ ...d, table_name, column_name: "" }));
                          setAvailableColumns(getColumnsForTable(table_name));
                        }}
                      >
                        <option value="">Select table</option>
                        {(tables || []).map((t) => (
                          <option key={t.id} value={t.table_name || ""}>
                            {t.table_name || "-"}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>
                        Field / Column <span className="text-danger">*</span>
                      </Label>
                      <Input
                        type="select"
                        value={fieldDraft.column_name}
                        disabled={isOrgExecutive || !fieldDraft.table_name}
                        onChange={(e) =>
                          setFieldDraft((d) => ({ ...d, column_name: e.target.value }))
                        }
                      >
                        <option value="">Select field</option>
                        {availableColumns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Description</Label>
                      <Input
                        type="text"
                        value={fieldDraft.description}
                        disabled={isOrgExecutive}
                        onChange={(e) =>
                          setFieldDraft((d) => ({
                            ...d,
                            description: e.target.value,
                          }))
                        }
                      />
                    </FormGroup>
                  </Col>
                </Row>
                {!isOrgExecutive && (
                  <div className="d-flex gap-2">
                    <Button
                      color="primary"
                      size="sm"
                      onClick={() => {
                        if (!fieldDraft.table_name?.trim()) {
                          showAlert("Related Table is required", "warning");
                          return;
                        }
                        if (!fieldDraft.column_name?.trim()) {
                          showAlert("Field / Column is required", "warning");
                          return;
                        }
                        // Prevent duplicates by (table_name + column_name), case-insensitive
                        const keyTable = fieldDraft.table_name.trim().toLowerCase();
                        const keyCol = fieldDraft.column_name.trim().toLowerCase();
                        const duplicateAt = fieldRows.findIndex(
                          (r, idx) =>
                            idx !== editingFieldIndex &&
                            (r.table_name || "").trim().toLowerCase() === keyTable &&
                            (r.column_name || "").trim().toLowerCase() === keyCol,
                        );
                        if (duplicateAt !== -1) {
                          showAlert("This column from the selected table is already added", "warning");
                          return;
                        }
                        const normalized = {
                          table_name: fieldDraft.table_name.trim(),
                          column_name: fieldDraft.column_name.trim(),
                          description: fieldDraft.description.trim(),
                        };
                        setFieldRows((rows) => {
                          if (editingFieldIndex !== null) {
                            return rows.map((r, idx) =>
                              idx === editingFieldIndex ? normalized : r,
                            );
                          }
                          return [...rows, normalized];
                        });
                        setEditingFieldIndex(null);
                        setFieldDraft({
                          table_name: "",
                          column_name: "",
                          description: "",
                        });
                        setAvailableColumns([]);
                      }}
                    >
                      <i className="bx bx-save me-1" />
                      {editingFieldIndex !== null ? "Update" : "Add"}
                    </Button>
                    {editingFieldIndex !== null && (
                      <Button
                        color="light"
                        size="sm"
                        onClick={() => {
                          setEditingFieldIndex(null);
                          setFieldDraft({
                            table_name: "",
                            column_name: "",
                            description: "",
                          });
                          setAvailableColumns([]);
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
                        <th>Field / Column Name</th>
                        <th>Related Table</th>
                        <th>Description</th>
                        {!isOrgExecutive && <th style={{ width: 80 }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {fieldRows.map((r, idx) => (
                        <tr key={`rep-field-${idx}`}>
                          <td>
                            <button
                              type="button"
                              className="btn btn-link p-0 text-primary fw-semibold"
                              onClick={() => {
                                setEditingFieldIndex(idx);
                                setFieldDraft({
                                  table_name: r.table_name || "",
                                  column_name: r.column_name || "",
                                  description: r.description || "",
                                });
                                setAvailableColumns(getColumnsForTable(r.table_name || ""));
                              }}
                            >
                              {r.column_name || "-"}
                            </button>
                          </td>
                          <td>{r.table_name || "-"}</td>
                          <td>{r.description || "-"}</td>
                          {!isOrgExecutive && (
                            <td className="text-center">
                              <Button
                                color="danger"
                                size="sm"
                                onClick={() =>
                                  setFieldRows((rows) =>
                                    rows.filter((_, i) => i !== idx),
                                  )
                                }
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
                  No report columns added yet. Use the form above to add columns.
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
                  onClick={() => handleDelete(editItem)}
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
        title="Delete Report"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
      />
    </>
  );
};

export default ReportsTab;


