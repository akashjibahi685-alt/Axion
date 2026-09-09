const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set.");
  process.exit(1);
}

function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token. Please log in again." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Access denied. Admin privileges required." });
  }
  next();
}

function requireStaff(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Access denied. Authentication required." });
  const staffRoles = ["Admin", "Head Administrator", "Core Lead", "Faculty Advisor", "Event Coordinator"];
  if (!req.user.isAdmin && !staffRoles.includes(req.user.role)) {
    return res.status(403).json({ error: "Access denied. Staff privileges required." });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireStaff };
