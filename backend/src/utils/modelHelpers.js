const wrapIdentifier = (key, quote = true) =>
  quote ? `"${key}"` : key;

const normalizeFieldName = (key) => {
  if (typeof key !== "string") {
    return key;
  }
  return key.toLowerCase();
};

const buildInsertFragments = (fields = {}, { quote = true } = {}) => {
  const keys = Object.keys(fields);
  const columns = keys
    .map((key) => wrapIdentifier(normalizeFieldName(key), quote))
    .join(", ");
  const values = Object.values(fields);
  const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
  return { columns, values, placeholders };
};

const buildUpdateFragments = (fields = {}, { quote = true } = {}) => {
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const setClause = keys
    .map(
      (key, index) =>
        `${wrapIdentifier(normalizeFieldName(key), quote)} = $${
          index + 1
        }`,
    )
    .join(", ");
  return { setClause, values };
};

module.exports = {
  buildInsertFragments,
  buildUpdateFragments,
};

