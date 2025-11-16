import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Col, Container, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row, Alert } from "reactstrap";
import TableContainer from "../../components/Common/TableContainer";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import useDeleteConfirmation from "../../hooks/useDeleteConfirmation";
import DeleteConfirmationModal from "../../components/Common/DeleteConfirmationModal";

const UsersManagement = () => {
  document.title = "Users | Uchakide App Manager";

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((message, color = "success") => {
    setAlert({ message, color });
    setTimeout(() => setAlert(null), 3500);
  }, []);

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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosApi.get(`${API_BASE_URL}/appManager/users`);
      setUsers(res.data || []);
    } catch (error) {
      showAlert(error?.response?.data?.error || "Unable to load users", "danger");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const { deleteModalOpen, deleteItem, deleteLoading, showDeleteConfirmation, hideDeleteConfirmation, confirmDelete } =
    useDeleteConfirmation();

  const columns = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "name",
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
      { header: "Username", accessorKey: "username", enableColumnFilter: false, cell: (c) => c.getValue() || "-" },
      { header: "Email", accessorKey: "email", enableColumnFilter: false, cell: (c) => c.getValue() || "-" },
      { header: "User Type", accessorKey: "user_type", enableColumnFilter: false, cell: (c) => c.getValue() || "-" },
      { header: "Status", accessorKey: "status", enableColumnFilter: false, cell: (c) => c.getValue() || "-" },
      { header: "Created By", accessorKey: "created_by", enableColumnFilter: false, cell: (c) => c.getValue() || "-" },
      {
        header: "Created At",
        accessorKey: "created_at",
        enableColumnFilter: false,
        cell: (c) => (c.getValue() ? new Date(c.getValue()).toLocaleDateString() : "-"),
      },
      { header: "Updated By", accessorKey: "updated_by", enableColumnFilter: false, cell: (c) => c.getValue() || "-" },
      {
        header: "Updated At",
        accessorKey: "updated_at",
        enableColumnFilter: false,
        cell: (c) => (c.getValue() ? new Date(c.getValue()).toLocaleDateString() : "-"),
      },
    ],
    [],
  );

  const toggleModal = () => {
    setModalOpen((p) => !p);
    if (modalOpen) {
      setEditItem(null);
      setForm({
        name: "",
        username: "",
        email: "",
        user_type: "",
        status: "Active",
        notes: "",
        password: "",
      });
    } else if (editItem) {
      setForm({
        name: editItem?.name || "",
        username: editItem?.username || "",
        email: editItem?.email || "",
        user_type: editItem?.user_type || "",
        status: editItem?.status || "Active",
        notes: editItem?.notes || "",
        password: "",
      });
    }
  };

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    user_type: "",
    status: "Active",
    notes: "",
    password: "",
  });

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Ensure edit/create forms always populate correctly regardless of how the modal is opened
  useEffect(() => {
    if (!modalOpen) return;
    if (editItem) {
      setForm({
        name: editItem?.name || "",
        username: editItem?.username || "",
        email: editItem?.email || "",
        user_type: editItem?.user_type || "",
        status: editItem?.status || "Active",
        notes: editItem?.notes || "",
        password: "",
      });
    } else {
      setForm({
        name: "",
        username: "",
        email: "",
        user_type: "",
        status: "Active",
        notes: "",
        password: "",
      });
    }
  }, [modalOpen, editItem]);

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name?.trim(),
        username: form.username?.trim(),
        email: form.email?.trim(),
        user_type: form.user_type?.trim() || null,
        status: form.status || "Active",
        notes: form.notes?.trim() || null,
      };
      if (form.password && form.password.trim()) {
        payload.password = form.password.trim();
      }
      if (editItem) {
        await axiosApi.put(`${API_BASE_URL}/appManager/users/${editItem.id}`, payload);
        showAlert('Users has been updated successfully.');
      } else {
        await axiosApi.post(`${API_BASE_URL}/appManager/users`, payload);
        showAlert('Users has been created successfully.');
      }
      setModalOpen(false);
      setEditItem(null);
      fetchUsers();
    } catch (error) {
      showAlert(error?.response?.data?.error || "Unable to save user", "danger");
    }
  };

  const handleDelete = (row) => {
    showDeleteConfirmation(
      { id: row.id, name: row.name || row.username || "-", type: "user", message: "This user will be removed." },
      async () => {
        await axiosApi.delete(`${API_BASE_URL}/appManager/users/${row.id}`);
        showAlert('Users has been deleted successfully.');
        fetchUsers();
      },
    );
  };

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

        <Row>
          <Col lg={12}>
            <Card>
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Users</h5>
                  <div className="d-flex align-items-center gap-2">
                    <Input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search users..."
                      style={{ width: 260, flex: "0 0 260px" }}
                    />
                    <Button color="primary" size="sm" style={{ flex: "0 0 auto" }} onClick={() => { setEditItem(null); setForm({ name: "", username: "", email: "", user_type: "", status: "Active", notes: "", password: "" }); setModalOpen(true); }}>
                      <i className="bx bx-plus me-1" />
                      Add User
                    </Button>
                  </div>
                </div>
                {users.length === 0 ? (
                  <div className="alert alert-info mb-0" role="alert">
                    <i className="bx bx-info-circle me-2" />
                    No users found. Click "Add User" to create one.
                  </div>
                ) : (
                  <TableContainer
                    columns={columns}
                    data={users.filter((u) => {
                      const t = searchTerm.toLowerCase();
                      if (!t) return true;
                      const composite = [
                        u.name,
                        u.username,
                        u.email,
                        u.user_type,
                        u.status,
                        u.created_by,
                        u.updated_by,
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
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Modal isOpen={modalOpen} toggle={toggleModal} centered size="lg" backdrop="static">
          <ModalHeader toggle={toggleModal}>{editItem ? "Edit User" : "New User"}</ModalHeader>
          <ModalBody>
            <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label>Name</Label>
                    <Input name="name" type="text" value={form.name} onChange={onChange} />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Username</Label>
                    <Input name="username" type="text" value={form.username} onChange={onChange} />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label>Email</Label>
                    <Input name="email" type="email" value={form.email} onChange={onChange} />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>User Type</Label>
                    <Input name="user_type" type="select" value={form.user_type} onChange={onChange}>
                      <option value="">Select type</option>
                      <option value="Super User">Super User</option>
                      <option value="Developer">Developer</option>
                      <option value="End User">End User</option>
                      <option value="Stakeholder">Stakeholder</option>
                      <option value="Project Manager">Project Manager</option>
                    </Input>
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label>Status</Label>
                    <Input name="status" type="select" value={form.status} onChange={onChange}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Password</Label>
                    <Input name="password" type="password" value={form.password} onChange={onChange} placeholder={editItem ? "(leave blank to keep)" : ""} autoComplete="new-password" />
                  </FormGroup>
                </Col>
              </Row>
              <FormGroup>
                <Label>Notes</Label>
                <Input name="notes" type="textarea" rows="3" value={form.notes} onChange={onChange} />
              </FormGroup>
            </Form>
          </ModalBody>
          <ModalFooter className="d-flex justify-content-between">
            <div>
              {editItem && (
                <Button color="danger" type="button" onClick={() => handleDelete(editItem)} disabled={loading}>
                  <i className="bx bx-trash me-1" />
                  Delete
                </Button>
              )}
            </div>
            <div className="d-flex gap-2">
              <Button color="light" onClick={toggleModal} disabled={loading}>
                <i className="bx bx-x me-1" />
                Cancel
              </Button>
              <Button color="primary" onClick={handleSave} disabled={loading}>
                <i className="bx bx-save me-1" />
                Save
              </Button>
            </div>
          </ModalFooter>
        </Modal>

        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          toggle={hideDeleteConfirmation}
          onConfirm={confirmDelete}
          loading={deleteLoading}
          title="Delete User"
          message={deleteItem?.message}
          itemName={deleteItem?.name}
          itemType={deleteItem?.type}
        />
      </Container>
    </div>
  );
};

export default UsersManagement;


