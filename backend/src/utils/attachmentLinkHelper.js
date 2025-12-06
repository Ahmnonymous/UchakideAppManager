/**
 * Attachment Link Helper
 * 
 * Adds `show_link` property to records with attachment fields.
 * Removes raw BYTEA attachment data from JSON to reduce payload size.
 * Works dynamically for any table with attachment columns.
 */

/**
 * List of attachment column base names (without suffixes)
 * These are the raw BYTEA columns that should be excluded from JSON
 */
const ATTACHMENT_COLUMN_NAMES = ["Attachment", "attachment"];

/**
 * List of attachment metadata suffixes
 * These fields should be kept in the JSON
 */
const ATTACHMENT_METADATA_SUFFIXES = ["_Filename", "_Mime", "_Size"];

/**
 * Check if a record has an attachment (has Attachment_Filename or Attachment column)
 */
const hasAttachment = (record) => {
  if (!record || typeof record !== "object") return false;
  return !!(
    record.Attachment_Filename ||
    record.attachment_filename ||
    record.Attachment ||
    record.attachment
  );
};

/**
 * Get the attachment column name (normalized)
 * Returns the base name of the attachment column (e.g., "Attachment")
 */
const getAttachmentColumnName = (record) => {
  for (const colName of ATTACHMENT_COLUMN_NAMES) {
    if (record[colName] !== undefined) {
      return colName.charAt(0).toUpperCase() + colName.slice(1).toLowerCase();
    }
  }
  // Default to "Attachment" if we detect metadata but no raw column
  if (record.Attachment_Filename || record.attachment_filename) {
    return "Attachment";
  }
  return null;
};

/**
 * Get all attachment-related field names for a given base column name
 * Returns: [baseColumn, baseColumn_Filename, baseColumn_Mime, baseColumn_Size]
 */
const getAttachmentFieldNames = (baseColumnName) => {
  const fields = [baseColumnName];
  ATTACHMENT_METADATA_SUFFIXES.forEach((suffix) => {
    fields.push(`${baseColumnName}${suffix}`);
  });
  return fields;
};

/**
 * Remove raw attachment data from a record while keeping metadata
 */
const removeRawAttachmentData = (record) => {
  if (!record || typeof record !== "object") return record;

  const cleaned = { ...record };

  // Find and remove raw attachment columns (BYTEA data)
  for (const colName of ATTACHMENT_COLUMN_NAMES) {
    // Check both case variations
    const variations = [
      colName,
      colName.charAt(0).toUpperCase() + colName.slice(1).toLowerCase(),
      colName.toLowerCase(),
      colName.toUpperCase(),
    ];

    variations.forEach((variation) => {
      if (cleaned[variation] !== undefined) {
        // Remove the raw BYTEA data
        delete cleaned[variation];
      }
    });
  }

  return cleaned;
};

/**
 * Generate show_link URL for an attachment
 * Format: /api/appManager/projects/:projectId/attachments/:table/:id/:column
 */
const generateShowLink = (projectId, tableName, recordId, columnName = "Attachment") => {
  if (!projectId || !tableName || !recordId) return null;
  
  // Always use relative path - let the client determine the base URL
  // This makes it work in any environment (dev, staging, production)
  const path = `/api/appManager/projects/${projectId}/attachments/${tableName}/${recordId}/${columnName}`;
  
  return path;
};

/**
 * Process a single record: remove raw attachment data and add show_link
 */
const processAttachmentRecord = (record, projectId, tableName) => {
  if (!record || !hasAttachment(record)) {
    // Even if no attachment, remove any raw attachment columns that might exist
    return removeRawAttachmentData(record);
  }

  const recordId = record.id || record.ID || record.Id;
  if (!recordId) {
    return removeRawAttachmentData(record);
  }

  const columnName = getAttachmentColumnName(record) || "Attachment";
  const showLink = generateShowLink(projectId, tableName, recordId, columnName);

  // Remove raw attachment data and add show_link
  const cleaned = removeRawAttachmentData(record);
  return {
    ...cleaned,
    show_link: showLink,
  };
};

/**
 * Process an array of records: remove raw attachment data and add show_link
 */
const processAttachmentRecords = (records, projectId, tableName) => {
  if (!Array.isArray(records)) {
    return records;
  }

  return records.map((record) => processAttachmentRecord(record, projectId, tableName));
};

/**
 * Process project snapshot data and add show_link to all attachment fields
 */
const processProjectSnapshot = (projectData, projectId) => {
  if (!projectData || !projectId) {
    return projectData;
  }

  const processed = { ...projectData };

  // Process payments
  if (Array.isArray(processed.payments)) {
    processed.payments = processAttachmentRecords(
      processed.payments,
      projectId,
      "Project_Payments",
    );
  }

  // Process bugs
  if (Array.isArray(processed.bugs)) {
    processed.bugs = processAttachmentRecords(
      processed.bugs,
      projectId,
      "Project_Bugs",
    );
  }

  // Process menus
  if (Array.isArray(processed.menus)) {
    processed.menus = processAttachmentRecords(
      processed.menus,
      projectId,
      "Project_Menus",
    );
  }

  // Process any other arrays that might have attachments
  // This is extensible for future tables
  Object.keys(processed).forEach((key) => {
    if (
      Array.isArray(processed[key]) &&
      processed[key].length > 0
    ) {
      // Check if any record in the array has attachment fields
      const hasAttachments = processed[key].some((record) => hasAttachment(record));
      
      if (hasAttachments) {
        // Map known keys to table names
        const tableNameMap = {
          payments: "Project_Payments",
          bugs: "Project_Bugs",
          menus: "Project_Menus",
        };

        const tableName = tableNameMap[key] || `Project_${key.charAt(0).toUpperCase() + key.slice(1)}`;
        processed[key] = processAttachmentRecords(
          processed[key],
          projectId,
          tableName,
        );
      } else {
        // Even if no attachments detected, clean any raw attachment columns
        processed[key] = processed[key].map((record) => removeRawAttachmentData(record));
      }
    }
  });

  return processed;
};

module.exports = {
  hasAttachment,
  getAttachmentColumnName,
  generateShowLink,
  removeRawAttachmentData,
  processAttachmentRecord,
  processAttachmentRecords,
  processProjectSnapshot,
};

