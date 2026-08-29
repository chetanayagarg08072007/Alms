const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "alms_production_secret_key_2026_jwt_token_secure";

// Authentication Middleware: Verifies token from Cookie or Bearer Header
function authenticate(req, res, next) {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: "Unauthorized. Please log in to your account." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Session expired or invalid. Please log in again." });
  }
}

// Optional Auth: Attaches user if token is present, does not fail if absent
function optionalAuth(req, res, next) {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

// Role Authorization Middleware: Checks if user has required role(s)
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized. Please log in." });
    }
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(req.user.role) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Access requires ${roles.join(" or ")} role. Current role is ${req.user.role}.`
      });
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  authenticate,
  optionalAuth,
  requireRole
};
