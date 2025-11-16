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

const getAuditEnrichment = (editItem) => {
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

const PaymentsTab = ({ projectId, payments, onRefresh, showAlert }) => {
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
  } = useForm({
    defaultValues: {
      payment_amount: "",
      payment_type: "Milestone",
      payment_status: "Pending",
      payment_date: "",
      notes: "",
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

  const openEditModal = (item) => {
    setEditItem(item);
    setModalOpen(true);
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

  useEffect(() => {
    if (modalOpen) {
      reset({
        payment_amount: editItem?.payment_amount || "",
        payment_type: editItem?.payment_type || "",
        payment_status: editItem?.payment_status || "Pending",
        payment_date: editItem?.payment_date
          ? formatDateToMMDDYYYY(editItem?.payment_date)
          : formatDateToMMDDYYYY(new Date().toISOString()),
        notes: editItem?.notes || "",
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
        payment_amount: values.payment_amount
          ? Number(values.payment_amount)
          : null,
        payment_type: values.payment_type,
        payment_status: values.payment_status,
        payment_date: parseDateToISO(values.payment_date),
        notes: values.notes || null,
        ...getAuditEnrichment(editItem),
        ...attachmentPayload,
      };

      if (editItem) {
        await axiosApi.put(
          `${API_BASE_URL}/appManager/payments/${editItem.id}`,
          payload,
        );
        showAlert("Payments has been updated successfully.");
      } else {
        await axiosApi.post(`${API_BASE_URL}/appManager/payments`, payload);
        showAlert("Payments has been created successfully.");
      }
      toggleModal();
      onRefresh();
    } catch (error) {
      console.error("Error saving payment:", error);
      showAlert(
        error?.response?.data?.error || "Unable to save payment",
        "danger",
      );
    }
  };

  const handleDelete = (item, closeModal = false) => {
    showDeleteConfirmation(
      {
        id: item.id,
        name: `Payment ${item.payment_amount || ""}`,
        type: "payment",
        message: "This payment record will be permanently removed.",
      },
      async () => {
        await axiosApi.delete(
          `${API_BASE_URL}/appManager/payments/${item.id}`,
        );
        showAlert("Payments has been deleted successfully.");
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
        header: "Amount (USD)",
        accessorKey: "payment_amount",
        enableColumnFilter: false,
        cell: (cell) => {
          const row = cell.row.original;
          const amount = parseFloat(cell.getValue()) || 0;
          return (
            <button
              type="button"
              className="btn btn-link p-0 fw-semibold text-primary"
              onClick={() => openEditModal(row)}
            >
              ${amount.toFixed(2)}
            </button>
          );
        },
      },
      {
        header: "Type",
        accessorKey: "payment_type",
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Status",
        accessorKey: "payment_status",
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Date",
        accessorKey: "payment_date",
        enableColumnFilter: false,
        cell: (cell) => formatDateValue(cell.getValue()),
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
                const url = `${API_STREAM_BASE_URL}/appManager/payments/${row.id}/attachment?t=${Date.now()}`;
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
        <h5 className="mb-0">Payments</h5>
        <div className="d-flex align-items-center gap-2">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payments..."
            style={{ width: 260, flex: "0 0 260px" }}
          />
          {!isOrgExecutive && (
            <Button color="primary" size="sm" style={{ flex: "0 0 auto" }} onClick={() => setModalOpen(true)}>
              <i className="bx bx-plus me-1" />
              Add Payment
            </Button>
          )}
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2" />
          No payments recorded yet. Click "Add Payment" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={payments.filter((p) => {
            const t = searchTerm.toLowerCase();
            if (!t) return true;
            const composite = [
              p.payment_amount,
              p.payment_type,
              p.payment_status,
              p.payment_date,
              p.notes,
              p.created_by,
              p.updated_by,
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

      <Modal isOpen={modalOpen} toggle={toggleModal} centered backdrop="static">
        <ModalHeader toggle={toggleModal}>
          {editItem ? "Edit Payment" : "Add Payment"}
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    Amount (USD) <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="payment_amount"
                    control={control}
                    rules={{ required: "Amount is required" }}
                    render={({ field }) => (
                      <Input
                        type="number"
                        step="0.01"
                        invalid={!!errors.payment_amount}
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                  {errors.payment_amount && (
                    <FormFeedback>{errors.payment_amount.message}</FormFeedback>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Payment Type</Label>
                  <Controller
                    name="payment_type"
                    control={control}
                    render={({ field }) => <Input type="text" disabled={isOrgExecutive} {...field} />}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>Status</Label>
                  <Controller
                    name="payment_status"
                    control={control}
                    render={({ field }) => (
                      <Input type="select" disabled={isOrgExecutive} {...field}>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Cancelled">Cancelled</option>
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Payment Date</Label>
                  <Controller
                    name="payment_date"
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
        title="Delete Payment"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
      />
    </>
  );
};

export default PaymentsTab;


