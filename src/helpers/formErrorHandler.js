const escapeForAttribute = (value = "") => {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
};

const findFirstErrorField = (errors, parentKey = "") => {
  if (!errors || typeof errors !== "object") return null;

  for (const key of Object.keys(errors)) {
    const error = errors[key];
    if (!error) continue;

    const fieldKey = parentKey ? `${parentKey}.${key}` : key;

    if (error?.ref || error?.message || error?.type) {
      return fieldKey;
    }

    if (typeof error === "object") {
      const nested = findFirstErrorField(error, fieldKey);
      if (nested) return nested;
    }
  }

  return null;
};

export const createFieldTabMap = (tabFieldMap = {}) => {
  const mapping = {};
  Object.entries(tabFieldMap).forEach(([tabId, fields]) => {
    (fields || []).forEach((field) => {
      if (field) {
        mapping[field] = String(tabId);
      }
    });
  });
  return mapping;
};

export const handleTabbedFormErrors = ({
  errors,
  fieldTabMap = {},
  tabLabelMap = {},
  setActiveTab,
  showAlert,
}) => {
  const firstErrorField = findFirstErrorField(errors);
  if (!firstErrorField) return;

  const targetTab = fieldTabMap[firstErrorField];
  if (targetTab && typeof setActiveTab === "function") {
    setActiveTab(String(targetTab));
  }

  if (typeof showAlert === "function") {
    const tabName = tabLabelMap[targetTab];
    const message = tabName
      ? `Please correct errors in the ${tabName} tab.`
      : "Please correct the highlighted fields.";
    showAlert(message, "danger");
  }

  setTimeout(() => {
    const escapedName = escapeForAttribute(firstErrorField);
    const fieldElement =
      document.getElementById(firstErrorField) ||
      document.querySelector(`[name="${escapedName}"]`);

    if (fieldElement) {
      if (typeof fieldElement.scrollIntoView === "function") {
        fieldElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (typeof fieldElement.focus === "function") {
        fieldElement.focus({ preventScroll: true });
      }
      fieldElement.classList?.add("form-error-focus");
      setTimeout(() => {
        fieldElement.classList?.remove("form-error-focus");
      }, 2000);
    }
  }, 120);
};

export const tabbedErrorUtils = {
  findFirstErrorField,
  createFieldTabMap,
  handleTabbedFormErrors,
};


