import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('[AUTH] JWT_SECRET environment variable is not set');
  return secret;
};

const getInternalApiKey = () => {
  const key = process.env.INTERNAL_API_KEY;
  if (!key) throw new Error('[AUTH] INTERNAL_API_KEY environment variable is not set');
  return key;
};

// JWT authentication middleware - used by ALL services
export const protect = (getDb) => async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // API Key auth (rf_ prefix) - only valid on auth/ripplify service
      if (token.startsWith('rf_')) {
        const db = getDb();
        const apiKeyRecord = await db('api_keys').where({ key: token, status: 'Active' }).first();
        if (!apiKeyRecord) {
          return res.status(401).json({ message: 'Invalid or inactive API Key' });
        }
        const user = await db('users').where({ id: apiKeyRecord.userId }).first();
        if (!user) {
          return res.status(401).json({ message: 'User associated with API Key not found' });
        }
        req.user = sanitizeUser(user);
      } else {
        // Standard JWT auth
        const decoded = jwt.verify(token, getJwtSecret());
        const db = getDb();
        const user = await db('users').where({ id: decoded.id }).first();
        if (!user) {
          return res.status(401).json({ message: 'Not authorized, user not found' });
        }
        req.user = sanitizeUser(user);
      }

      if (req.user.isDisabled) {
        return res.status(403).json({ message: 'Your account has been disabled. Contact support for assistance.' });
      }

      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      console.error('Auth verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// JWT-only auth (no API key support) - for services that don't have api_keys table
export const protectJwt = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret());
      req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin check middleware
export const admin = async (req, res, next) => {
  const role = req.user?.role?.toLowerCase();
  if (role === 'admin' || role === 'super admin') return next();
  res.status(403).json({ message: 'Not authorized as an admin' });
};

// Internal service-to-service auth middleware
export const internalAuth = (req, res, next) => {
  const key = req.headers['x-internal-api-key'];
  if (!key || key !== getInternalApiKey()) {
    return res.status(403).json({ message: 'Forbidden: invalid internal API key' });
  }
  next();
};

// Generate JWT token
export const generateToken = (id, email, role) => {
  return jwt.sign({ id, email, role }, getJwtSecret(), { expiresIn: '1d' });
};

// Verify JWT token (for internal use)
export const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

// Strip sensitive fields from user object
function sanitizeUser(user) {
  const { password, pin, ...safe } = user;
  return safe;
}
