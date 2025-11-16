const sanitizeBase64 = (value) => {
  if (!value) return null;
  return value.includes(",") ? value.split(",").pop() : value;
};

const applyBase64Attachment = (payload, options = {}) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const { bufferField = "attachment", base64Field } = options;
  const key =
    base64Field ||
    `${bufferField}_base64`;
  const altKey = `${bufferField}Base64`;

  const candidate = payload[key] || payload[altKey];

  if (!candidate) {
    delete payload[key];
    delete payload[altKey];
    return null;
  }

  const sanitized = sanitizeBase64(candidate);

  try {
    payload[bufferField] = Buffer.from(sanitized, "base64");
  } catch (error) {
    delete payload[bufferField];
    return "Invalid attachment encoding";
  }

  delete payload[key];
  delete payload[altKey];
  return null;
};

module.exports = {
  applyBase64Attachment,
};


