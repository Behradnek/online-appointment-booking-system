const jwt = require('jsonwebtoken');
const db = require('../database');

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token is required.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    const activeUser = await db.get('SELECT is_active FROM users WHERE id = ?', [req.user.id]);

    if (!activeUser?.is_active) {
      return res.status(403).json({ error: 'This account has been deactivated.' });
    }

    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function checkRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }

    return next();
  };
}

module.exports = { verifyToken, checkRole };
