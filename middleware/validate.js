function required(body, keys = []) {
  if (!body) return "Request body is required";
  for (const key of keys) {
    if (body[key] == null || String(body[key]).trim() === "") {
      return `Missing required field: ${key}`;
    }
  }
  return null;
}

module.exports = {
  required
};
