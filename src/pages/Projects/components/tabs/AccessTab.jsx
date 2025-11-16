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

const AccessTab = ({ projectId, roles = [], menus = [], accessList = [], onRefresh, showAlert }) => {
  const { isOrgExecutive } = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeRole, setActiveRole] = useState(null);
  const [assignedRows, setAssignedRows] = useState([]); // menus present in access_json
  const [unassignedRows, setUnassignedRows] = useState([]); // menus not present
  const [filterAssigned, setFilterAssigned] = useState("");
  const [filterUnassigned, setFilterUnassigned] = useState("");
  const [selectedAssigned, setSelectedAssigned] = useState(new Set()); // ids
  const [selectedUnassigned, setSelectedUnassigned] = useState(new Set()); // ids
  const [searchTerm, setSearchTerm] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
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

  useEffect(() => {
    const load = async () => {
      if (!(modalOpen && activeRole)) return;
      try {
        // Fetch latest access for this role from backend to avoid stale props
        const resp = await axiosApi.get(
          `${API_BASE_URL}/appManager/role-menu-access?projectId=${projectId}&roleId=${activeRole.id}`,
        );
        const existing = Array.isArray(resp.data) ? resp.data[0] : null;
        const raw = existing?.access_json;
        let existingJson = [];
        if (raw) {
          try {
            existingJson = Array.isArray(raw) ? raw : JSON.parse(typeof raw === "string" ? raw : "[]");
          } catch {
            existingJson = [];
          }
        }
        const normalizeVisibility = (v) => {
          if (typeof v === "boolean") return v ? "Show" : "Hide";
          const sv = String(v ?? "Show").toLowerCase();
          if (sv === "true" || sv === "show" || sv === "visible" || sv === "yes") return "Show";
          if (sv === "false" || sv === "hide" || sv === "hidden" || sv === "no") return "Hide";
          return "Show";
        };
        const normalizeAccess = (v) => {
          const sv = String(v ?? "Read").toLowerCase();
          if (sv === "write" || sv === "w" || sv === "edit") return "Write";
          return "Read";
        };
        const existingByMenuId = new Map(
          existingJson.map((x) => [
            Number(x.menu_id),
            {
              menu_id: Number(x.menu_id),
              menu_name: x.menu_name || "",
              visibility: normalizeVisibility(x.visibility ?? x.Visibility ?? x.visible ?? x.Visible),
              access_level: normalizeAccess(x.access_level ?? x.Access_Level ?? x.accessLevel),
            },
          ]),
        );
        const newAssigned = [];
        const newUnassigned = [];
        (menus || []).forEach((m) => {
          const menu_id = Number(m.id);
          const base = { menu_id, menu_name: m.menu_name || "" };
          if (existingByMenuId.has(menu_id)) {
            const prev = existingByMenuId.get(menu_id) || {};
            newAssigned.push({
              ...base,
              visibility: prev.visibility || "Show",
              access_level: prev.access_level || "Read",
            });
          } else {
            newUnassigned.push({
              ...base,
              visibility: "Show",
              access_level: "Read",
            });
          }
        });
        setAssignedRows(newAssigned);
        setUnassignedRows(newUnassigned);
        setSelectedAssigned(new Set());
        setSelectedUnassigned(new Set());
        reset({
          notes: existing?.notes || "",
        });
      } catch {
        // fallback to props path
      }
    };
    load();
  }, [modalOpen, activeRole, accessList, menus, reset, projectId]);

  const toggleModal = () => {
    setModalOpen((prev) => !prev);
    if (modalOpen) {
      setActiveRole(null);
    }
  };

  const roleIdToName = useMemo(() => {
    const map = new Map();
    (roles || []).forEach((r) => map.set(String(r.id), r.role_name || r.name || "-"));
    return map;
  }, [roles]);

  const onSubmit = async (values) => {
    try {
      const access_json = assignedRows.map((r) => ({
        menu_id: Number(r.menu_id),
        menu_name: r.menu_name || "",
        visibility: r.visibility || "Show",
        access_level: r.access_level || "Read",
      }));
      const existing = (accessList || []).find((a) => a.role_id === activeRole.id);
      const payload = {
        project_id: projectId,
        role_id: activeRole.id,
        access_json,
        notes: values.notes || null,
      };
      if (existing) {
        await axiosApi.put(`${API_BASE_URL}/appManager/role-menu-access/${existing.id}`, payload);
        showAlert("Access has been updated successfully.");
      } else {
        await axiosApi.post(`${API_BASE_URL}/appManager/role-menu-access`, payload);
        showAlert("Access has been created successfully.");
      }
      toggleModal();
      onRefresh();
    } catch (error) {
      console.error("Error saving access mapping:", error);
      showAlert(error?.response?.data?.error || "Unable to save access mapping", "danger");
    }
  };

  const handleDelete = (item) => {
    showDeleteConfirmation(
      {
        id: item.id,
        name: roleIdToName.get(String(item.role_id)) || "-",
        type: "access mapping",
        message: "This role access configuration will be removed.",
      },
      async () => {
        await axiosApi.delete(`${API_BASE_URL}/appManager/role-menu-access/${item.id}`);
        showAlert("Access has been deleted successfully.");
        onRefresh();
        setModalOpen(false);
        setActiveRole(null);
      },
    );
  };

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
                setActiveRole(row);
                setModalOpen(true);
              }}
            >
              {value}
            </button>
          );
        },
      },
      { header: "Notes", accessorKey: "notes", enableColumnFilter: false, cell: (cell) => cell.getValue() || "-" },
      { header: "Created By", accessorKey: "created_by", enableColumnFilter: false, cell: (cell) => cell.getValue() || "-" },
      { header: "Created At", accessorKey: "created_at", enableColumnFilter: false, cell: (cell) => (cell.getValue() ? new Date(cell.getValue()).toLocaleDateString() : "-") },
      { header: "Updated By", accessorKey: "updated_by", enableColumnFilter: false, cell: (cell) => cell.getValue() || "-" },
      { header: "Updated At", accessorKey: "updated_at", enableColumnFilter: false, cell: (cell) => (cell.getValue() ? new Date(cell.getValue()).toLocaleDateString() : "-") },
    ],
    [],
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Access</h5>
        <div className="d-flex align-items-center gap-2">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search roles..."
            style={{ width: 260, flex: "0 0 260px" }}
          />
        </div>
      </div>

      {(roles || []).length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2" />
          No roles found. Add roles first to configure access.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={(roles || [])
            .map((r) => ({ ...r, role_name: r.role_name }))
            .filter((r) => {
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

      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="xl" backdrop="static">
        <ModalHeader toggle={toggleModal}>{activeRole ? `Configure Access: ${activeRole.role_name}` : "Configure Access"}</ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            {/* Notes first, like other modals */}
            <FormGroup className="mb-3">
              <Label>Notes</Label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => <Input type="textarea" rows="3" disabled={isOrgExecutive} {...field} />}
              />
            </FormGroup>
            {/* Side-by-side reports */}
            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Assigned Menus ({assignedRows.length})</h6>
                    <div style={{ minWidth: 240 }}>
                      <Input
                        type="text"
                        placeholder="Search assigned..."
                        value={filterAssigned}
                        onChange={(e) => setFilterAssigned(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="table-responsive border rounded" style={{ maxHeight: 220, overflowY: "auto" }}>
                    <table className="table table-sm table-bordered align-middle mb-2" style={{ tableLayout: "fixed" }}>
                      <colgroup>
                        <col style={{ width: "36px" }} />
                        <col />
                        <col style={{ width: "120px" }} />
                        <col style={{ width: "140px" }} />
                        <col style={{ width: "80px" }} />
                      </colgroup>
                      <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                        <tr>
                          <th className="text-center" style={{ width: 36, background: "var(--bs-light)" }}>
                            <Input
                              type="checkbox"
                              checked={assignedRows.length > 0 && selectedAssigned.size === assignedRows.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAssigned(new Set(assignedRows.map((r) => r.menu_id)));
                                } else {
                                  setSelectedAssigned(new Set());
                                }
                              }}
                            />
                          </th>
                          <th className="text-center" style={{ background: "var(--bs-light)" }}>Menu Name</th>
                          <th className="text-center" style={{ width: 120, background: "var(--bs-light)" }}>Visible</th>
                          <th className="text-center" style={{ width: 140, background: "var(--bs-light)" }}>Access</th>
                          <th className="text-center" style={{ width: 80, background: "var(--bs-light)" }}>Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedRows
                          .filter((r) => r.menu_name.toLowerCase().includes(filterAssigned.toLowerCase()))
                          .map((r) => (
                            <tr key={`assigned-${r.menu_id}`}>
                              <td className="text-center">
                                <Input
                                  type="checkbox"
                                  checked={selectedAssigned.has(r.menu_id)}
                                  onChange={(e) => {
                                    const s = new Set(selectedAssigned);
                                    if (e.target.checked) s.add(r.menu_id);
                                    else s.delete(r.menu_id);
                                    setSelectedAssigned(s);
                                  }}
                                />
                              </td>
                              <td>{r.menu_name || "-"}</td>
                              <td className="text-center">
                                <Input
                                  type="checkbox"
                                  checked={(r.visibility || "Show") === "Show"}
                                  disabled={isOrgExecutive}
                                  onChange={(e) =>
                                    setAssignedRows((list) =>
                                      list.map((x) =>
                                        x.menu_id === r.menu_id
                                          ? { ...x, visibility: e.target.checked ? "Show" : "Hide" }
                                          : x,
                                      ),
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <Input
                                  type="select"
                                  value={r.access_level || "Read"}
                                  disabled={isOrgExecutive}
                                  onChange={(e) =>
                                    setAssignedRows((list) =>
                                      list.map((x) =>
                                        x.menu_id === r.menu_id ? { ...x, access_level: e.target.value } : x,
                                      ),
                                    )
                                  }
                                >
                                  <option value="Read">Read</option>
                                  <option value="Write">Write</option>
                                </Input>
                              </td>
                              <td className="text-center">
                                <Button
                                  color="danger"
                                  size="sm"
                                  onClick={() => {
                                    setAssignedRows((list) => list.filter((x) => x.menu_id !== r.menu_id));
                                    setUnassignedRows((list) => [
                                      ...list,
                                      { menu_id: r.menu_id, menu_name: r.menu_name, visibility: "Show", access_level: "Read" },
                                    ]);
                                    setSelectedAssigned((s) => {
                                      const ns = new Set(s);
                                      ns.delete(r.menu_id);
                                      return ns;
                                    });
                                  }}
                                >
                                  <i className="bx bx-minus" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Unassigned Menus ({unassignedRows.length})</h6>
                    <div style={{ minWidth: 240 }}>
                      <Input
                        type="text"
                        placeholder="Search unassigned..."
                        value={filterUnassigned}
                        onChange={(e) => setFilterUnassigned(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="table-responsive border rounded" style={{ maxHeight: 220, overflowY: "auto" }}>
                    <table className="table table-sm table-bordered align-middle mb-2" style={{ tableLayout: "fixed" }}>
                      <colgroup>
                        <col style={{ width: "36px" }} />
                        <col />
                        <col style={{ width: "120px" }} />
                        <col style={{ width: "140px" }} />
                        <col style={{ width: "80px" }} />
                      </colgroup>
                      <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                        <tr>
                          <th className="text-center" style={{ width: 36, background: "var(--bs-light)" }}>
                            <Input
                              type="checkbox"
                              checked={
                                unassignedRows.length > 0 && selectedUnassigned.size === unassignedRows.length
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUnassigned(new Set(unassignedRows.map((r) => r.menu_id)));
                                } else {
                                  setSelectedUnassigned(new Set());
                                }
                              }}
                            />
                          </th>
                          <th className="text-center" style={{ background: "var(--bs-light)" }}>Menu Name</th>
                          <th className="text-center" style={{ width: 120, background: "var(--bs-light)" }}>Visible</th>
                          <th className="text-center" style={{ width: 140, background: "var(--bs-light)" }}>Access</th>
                          <th className="text-center" style={{ width: "120px", background: "var(--bs-light)" }}>Add</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unassignedRows
                          .filter((r) => r.menu_name.toLowerCase().includes(filterUnassigned.toLowerCase()))
                          .map((r) => (
                            <tr key={`unassigned-${r.menu_id}`}>
                              <td className="text-center">
                                <Input
                                  type="checkbox"
                                  checked={selectedUnassigned.has(r.menu_id)}
                                  onChange={(e) => {
                                    const s = new Set(selectedUnassigned);
                                    if (e.target.checked) s.add(r.menu_id);
                                    else s.delete(r.menu_id);
                                    setSelectedUnassigned(s);
                                  }}
                                />
                              </td>
                              <td>{r.menu_name || "-"}</td>
                              <td className="text-center">
                                <Input
                                  type="checkbox"
                                  checked={(r.visibility || "Show") === "Show"}
                                  disabled={isOrgExecutive}
                                  onChange={(e) =>
                                    setUnassignedRows((list) =>
                                      list.map((x) =>
                                        x.menu_id === r.menu_id
                                          ? { ...x, visibility: e.target.checked ? "Show" : "Hide" }
                                          : x,
                                      ),
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <Input
                                  type="select"
                                  value={r.access_level || "Read"}
                                  disabled={isOrgExecutive}
                                  onChange={(e) =>
                                    setUnassignedRows((list) =>
                                      list.map((x) =>
                                        x.menu_id === r.menu_id ? { ...x, access_level: e.target.value } : x,
                                      ),
                                    )
                                  }
                                >
                                  <option value="Read">Read</option>
                                  <option value="Write">Write</option>
                                </Input>
                              </td>
                              <td className="text-center">
                                <Button
                                  color="primary"
                                  size="sm"
                                  onClick={() => {
                                    setUnassignedRows((list) => list.filter((x) => x.menu_id !== r.menu_id));
                                    setAssignedRows((list) => [...list, { ...r }]);
                                    setSelectedUnassigned((s) => {
                                      const ns = new Set(s);
                                      ns.delete(r.menu_id);
                                      return ns;
                                    });
                                  }}
                                >
                                  <i className="bx bx-plus" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="d-flex justify-content-between">
            <div>
              {activeRole && !isOrgExecutive && (() => {
                const existing = (accessList || []).find((a) => a.role_id === activeRole.id);
                return existing ? (
                <Button color="danger" type="button" onClick={() => handleDelete(existing)} disabled={isSubmitting}>
                  <i className="bx bx-trash me-1" />
                  Delete
                </Button>
                ) : null;
              })()}
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
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
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
        title="Delete Access Mapping"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
      />
    </>
  );
};

export default AccessTab;


