const jwt = require("jsonwebtoken");

function adminAuth(req, res, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(503).json({ message: "Admin authentication is not configured." });
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Please sign in as admin." });
  }

  try {
    const payload = jwt.verify(token, secret);
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required." });
    }

    req.admin = true;
    next();
  } catch {
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }
}

module.exports = adminAuth;
