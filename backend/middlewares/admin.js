function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access is required.' });
  }

  next();
}

module.exports = requireAdmin;
