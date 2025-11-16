const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({ msg: "No token, authorization denied" });
    }

    // ✅ Support both "Bearer <token>" and raw "<token>"
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token) {
      return res.status(401).json({ msg: "No token, authorization denied" });
    }

    // ✅ Verify token using secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded user data to request (e.g., id, username, userType)
    req.user = decoded;

    return next();
  } catch (err) {
    console.error("❌ JWT verify failed:", err.message);
    return res.status(401).json({ msg: "Token is not valid" });
  }
};
