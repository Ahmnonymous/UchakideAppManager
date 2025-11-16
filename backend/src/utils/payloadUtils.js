const stripAutoId = (payload) => {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  ["id", "ID", "Id", "iD"].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      delete payload[key];
    }
  });

  return payload;
};

module.exports = {
  stripAutoId,
};


