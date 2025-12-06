const pool = require("../config/db");

/**
 * Attachment Controller
 * Serves attachment files from BYTEA columns
 */
const attachmentController = {
  /**
   * Get attachment by table, record ID, and column name
   * GET /api/appManager/projects/:projectId/attachments/:table/:id/:column
   */
  getAttachment: async (req, res) => {
    try {
      const { projectId, table, id, column } = req.params;

      if (!projectId || !table || !id || !column) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Validate table name to prevent SQL injection
      const allowedTables = [
        "Project_Payments",
        "Project_Bugs",
        "Project_Menus",
      ];
      if (!allowedTables.includes(table)) {
        return res.status(400).json({ error: "Invalid table name" });
      }

      // Validate column name
      if (column !== "Attachment" && column !== "attachment") {
        return res.status(400).json({ error: "Invalid column name" });
      }

      // Query the attachment
      // Note: Our schema uses unquoted identifiers, so PostgreSQL converts them to lowercase
      // But we'll use the exact column names as defined in schema.sql
      const query = `
        SELECT 
          Attachment AS attachment_data,
          Attachment_Filename AS filename,
          Attachment_Mime AS mime_type,
          Attachment_Size AS file_size
        FROM ${table}
        WHERE ID = $1 AND Project_ID = $2
      `;

      const result = await pool.query(query, [id, projectId]);

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ error: "Attachment not found" });
      }

      const row = result.rows[0];
      const attachmentData = row.attachment_data;
      const filename = row.filename || "attachment";
      const mimeType = row.mime_type || "application/octet-stream";
      const fileSize = row.file_size || 0;

      if (!attachmentData) {
        return res.status(404).json({ error: "No attachment data found" });
      }

      // Set appropriate headers
      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${filename}"`,
      );
      res.setHeader("Content-Length", fileSize);

      // Send the binary data
      // If attachmentData is a Buffer, send it directly
      // If it's a string (base64), convert it first
      let buffer;
      if (Buffer.isBuffer(attachmentData)) {
        buffer = attachmentData;
      } else if (typeof attachmentData === "string") {
        // Try to decode as base64
        buffer = Buffer.from(attachmentData, "base64");
      } else {
        buffer = Buffer.from(attachmentData);
      }

      return res.send(buffer);
    } catch (error) {
      console.error("Error serving attachment:", error);
      return res.status(500).json({ error: error.message });
    }
  },
};

module.exports = attachmentController;

