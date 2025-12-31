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
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import TableContainer from "../../../../components/Common/TableContainer";
import DeleteConfirmationModal from "../../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../../hooks/useDeleteConfirmation";
import { useRole } from "../../../../helpers/useRole";
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL, API_STREAM_BASE_URL } from "../../../../helpers/url_helper";

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

const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"]; const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const MenusTab = ({ projectId, menus = [], onRefresh, showAlert }) => {
  const { isOrgExecutive } = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [fileRef, setFileRef] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dynamicIconOptions, setDynamicIconOptions] = useState([]);

  const baseIconOptions = useMemo(
    () => [
      "bx bx-home",
      "bx bx-menu",
      "bx bx-grid-alt",
      "bx bx-list-ul",
      "bx bx-user",
      "bx bx-group",
      "bx bx-cog",
      "bx bx-file",
      "bx bx-bar-chart",
      "bx bx-link",
      "bx bx-image",
      "bx bx-news",
      "bx bx-folder",
      "bx bx-table",
      "bx bx-layer",
    ].map((cls) => ({ value: cls, label: (<span><i className={`${cls} me-2`}></i>{cls}</span>) })),
    []
  );

  useEffect(() => {
    if (!modalOpen) return;
    try {
      const set = new Set();
      const sheets = Array.from(document.styleSheets || []);
      for (const sheet of sheets) {
        let rules;
        try {
          rules = sheet.cssRules;
        } catch (e) {
          continue;
        }
        if (!rules) continue;
        for (const rule of Array.from(rules)) {
          if (rule.type === CSSRule.STYLE_RULE && rule.selectorText) {
            const selectors = String(rule.selectorText).split(",");
            for (let sel of selectors) {
              sel = sel.trim();
              const m = sel.match(/\.bx[s|l|-][^:\s]*/);
              if (m && m[0]) {
                const iconClass = m[0].replace(/^\./, "");
                const full = iconClass.startsWith("bx ") ? iconClass : `bx ${iconClass}`;
                set.add(full);
              }
            }
          }
        }
      }
      const options = Array.from(set)
        .sort((a, b) => a.localeCompare(b))
        .map((cls) => ({ value: cls, label: (<span><i className={`${cls} me-2`}></i>{cls}</span>) }));
      setDynamicIconOptions(options);
    } catch (e) {
      // ignore
    }
  }, [modalOpen]);

  const allIconOptions = useMemo(() => {
    const byVal = new Map();
    [...baseIconOptions, ...dynamicIconOptions].forEach((o) => {
      if (!byVal.has(o.value)) byVal.set(o.value, o);
    });
    return Array.from(byVal.values());
  }, [baseIconOptions, dynamicIconOptions]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      menu_type: "",
      menu_name: "",
      menu_parent: "",
      description: "",
      sort_order: "",
      icon: "",
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
        menu_type: editItem?.menu_type || "",
        menu_name: editItem?.menu_name || "",
        menu_parent: editItem?.menu_parent || "",
        description: editItem?.description || "",
        sort_order: editItem?.sort_order ?? "",
        icon: editItem?.icon || "",
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
      formData.append("menu_type", values.menu_type);
      formData.append("menu_name", values.menu_name?.trim());
      if (values.menu_parent?.trim()) formData.append("menu_parent", values.menu_parent.trim());
      if (values.description) formData.append("description", values.description);
      if (values.sort_order !== "" && values.sort_order !== null && values.sort_order !== undefined) {
        formData.append("sort_order", String(values.sort_order));
      }
      if (values.icon) formData.append("icon", values.icon);
      const audit = withAudit(editItem);
      Object.entries(audit).forEach(([k, v]) => formData.append(k, v));
      if (fileRef) {
        formData.append("file", fileRef);
      }

      const keyName = (values.menu_name || "").toLowerCase();
      const keyParent = (values.menu_parent || "").toLowerCase();
      const existingIdx = (menus || []).findIndex((m) => {
        if (editItem && m.id === editItem.id) return false;
        return (
          (m.menu_name || "").toLowerCase() === keyName &&
          (m.menu_parent || "").toLowerCase() === keyParent
        );
      });
      if (existingIdx !== -1) {
        showAlert("This menu already exists under the selected parent", "warning");
        return;
      }

      if (editItem) {
        await axiosApi.put(`${API_BASE_URL}/appManager/menus/${editItem.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showAlert("Menus has been updated successfully.");
      } else {
        await axiosApi.post(`${API_BASE_URL}/appManager/menus`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showAlert("Menus has been created successfully.");
      }
      toggleModal();
      onRefresh();
    } catch (error) {
      console.error("Error saving menu:", error);
      showAlert(error?.response?.data?.error || "Unable to save menu", "danger");
    }
  };

  const handleDelete = (item) => {
    showDeleteConfirmation(
      {
        id: item.id,
        name: item.menu_name,
        type: "menu",
        message: "This menu will be removed.",
      },
      async () => {
        await axiosApi.delete(`${API_BASE_URL}/appManager/menus/${item.id}`);
        showAlert("Menus has been deleted successfully.");
        onRefresh();
        setModalOpen(false);
        setEditItem(null);
      },
    );
  };

  const formatDateValue = (value) => (value ? new Date(value).toLocaleDateString() : "-");

  const menuParentOptions = useMemo(() => {
    const names = Array.from(
      new Set((menus || []).map((m) => (m.menu_name || "").trim()).filter(Boolean)),
    );
    return names;
  }, [menus]);

  const selectStyles = useMemo(
    () => ({
      control: (provided) => ({
        ...provided,
        backgroundColor: "var(--bs-body-bg)",
        color: "var(--bs-body-color)",
        minHeight: 38,
      }),
      singleValue: (provided) => ({ ...provided, color: "var(--bs-body-color)" }),
      input: (provided) => ({ ...provided, color: "var(--bs-body-color)" }),
      placeholder: (provided) => ({ ...provided, color: "var(--bs-secondary-color)" }),
      menu: (provided) => ({ ...provided, backgroundColor: "var(--bs-body-bg)", zIndex: 1061 }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? "var(--bs-tertiary-bg)" : "var(--bs-body-bg)",
        color: "var(--bs-body-color)",
      }),
    }),
    [],
  );

  const columns = useMemo(
    () => [
      {
        header: "Menu Name",
        accessorKey: "menu_name",
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
        header: "Type",
        accessorKey: "menu_type",
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Parent",
        accessorKey: "menu_parent",
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Sort",
        accessorKey: "sort_order",
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() ?? "-",
      },
      {
        header: "Attachment",
        accessorKey: "attachment_filename",
        enableColumnFilter: false,
        cell: (cell) => {
          const row = cell.row.original;
          if (!(row.attachment_mime || "").toLowerCase().startsWith("image/")) return "-";
          return (
            <button
              type="button"
              className="btn btn-link p-0 text-primary"
              title="View attachment"
              onClick={() => {
                const url = `${API_STREAM_BASE_URL}/appManager/menus/${row.id}/attachment?t=${Date.now()}`;
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
        <h5 className="mb-0">Menus</h5>
        <div className="d-flex align-items-center gap-2">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search menus..."
            style={{ width: 260, flex: "0 0 260px" }}
          />
          {!isOrgExecutive && (
            <Button color="primary" size="sm" style={{ flex: "0 0 auto" }} onClick={() => setModalOpen(true)}>
              <i className="bx bx-plus me-1" />
              Add Menu
            </Button>
          )}
        </div>
      </div>

      {menus.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2" />
          No menus added yet. Click "Add Menu" to start documenting navigation.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={(menus || []).filter((m) => {
            const t = searchTerm.toLowerCase();
            if (!t) return true;
            const composite = [m.menu_name, m.menu_type, m.menu_parent, m.description, m.created_by, m.updated_by]
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
        <ModalHeader toggle={toggleModal}>{editItem ? "Edit Menu" : "New Menu"}</ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            {/* Row 1: Menu Name full width */}
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label>
                    Menu Name <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="menu_name"
                    control={control}
                    rules={{ required: "Menu name is required" }}
                    render={({ field }) => (
                      <Input type="text" invalid={!!errors.menu_name} disabled={isOrgExecutive} {...field} />
                    )}
                  />
                  {errors.menu_name && <FormFeedback>{errors.menu_name.message}</FormFeedback>}
                </FormGroup>
              </Col>
            </Row>

            {/* Row 2: Menu Type + Icon */}
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    Menu Type <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="menu_type"
                    control={control}
                    rules={{ required: "Menu type is required" }}
                    render={({ field }) => (
                      <Input type="select" invalid={!!errors.menu_type} disabled={isOrgExecutive} {...field}>
                        <option value="">Select type</option>
                        <option value="Navigation Menu">Navigation Menu</option>
                        <option value="Navigation Bar">Navigation Bar</option>
                      </Input>
                    )}
                  />
                  {errors.menu_type && <FormFeedback>{errors.menu_type.message}</FormFeedback>}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Icon</Label>
                  <Controller
                    name="icon"
                    control={control}
                    render={({ field }) => (
                      <div className="d-flex align-items-center gap-2 w-100">
                        <CreatableSelect
                          className="react-select-container flex-grow-1"
                          classNamePrefix="react-select"
                          isClearable
                          isSearchable
                          styles={selectStyles}
                          options={allIconOptions}
                          value={allIconOptions.find((o) => o.value === field.value) || (field.value ? { value: field.value, label: (<span><i className={`${field.value} me-2`}></i>{field.value}</span>) } : null)}
                          onChange={(opt) => field.onChange(opt ? opt.value : "")}
                          formatCreateLabel={(inputValue) => (
                            <span><i className={`bx ${inputValue} me-2`}></i>Create "{inputValue}"</span>
                          )}
                          placeholder="Search or type any Boxicons class..."
                        />
                        {field.value ? <i className={`${field.value} fs-5`} /> : null}
                      </div>
                    )}
                  />
                </FormGroup>
              </Col>
            </Row>

            {/* Row 3: Menu Parent + Sort Order */}
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>Menu Parent</Label>
                  <Controller
                    name="menu_parent"
                    control={control}
                    render={({ field }) => (
                      <Input type="select" disabled={isOrgExecutive} {...field}>
                        <option value="">None</option>
                        {menuParentOptions
                          .filter((name) => name.toLowerCase() !== (editItem?.menu_name || "").toLowerCase())
                          .map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                      </Input>
                    )}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Sort Order</Label>
                  <Controller
                    name="sort_order"
                    control={control}
                    render={({ field }) => (
                      <Input type="number" step="1" min="0" disabled={isOrgExecutive} {...field} />
                    )}
                  />
                </FormGroup>
              </Col>
            </Row>

            {/* Description */}
            <FormGroup>
              <Label>Description</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Input type="textarea" rows="3" disabled={isOrgExecutive} {...field} />
                )}
              />
            </FormGroup>

            {/* Attachment */}
            <FormGroup>
              <Label>Attachment (Expected Page Design)</Label>
              <div className="d-flex flex-column gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  disabled={isOrgExecutive}
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f && !(String(f.type || "").toLowerCase().startsWith("image/"))) {
                      showAlert && showAlert("Only image files are allowed", "warning");
                      e.target.value = "";
                      setFileRef(null);
                      return;
                    }
                    setFileRef(f);
                  }}
                />
                {editItem && (editItem.attachment || editItem.attachment_filename) && (
                  <div className="p-2 border rounded bg-light">
                    <div className="d-flex align-items-center">
                      <i className="bx bx-file font-size-24 text-primary me-2"></i>
                      <div className="flex-grow-1">
                        <div className="fw-medium">{editItem.attachment_filename || "attachment"}</div>
                        <small className="text-muted">{formatFileSize(editItem.attachment_size)} • Current file</small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </FormGroup>
          </ModalBody>
          <ModalFooter className="d-flex justify-content-between">
            <div>
              {editItem && !isOrgExecutive && (
                <Button color="danger" type="button" onClick={() => handleDelete(editItem)} disabled={isSubmitting}>
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
        title="Delete Menu"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
      />
    </>
  );
};

export default React.memo(MenusTab);


