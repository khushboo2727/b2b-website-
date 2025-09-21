import jwt from 'jsonwebtoken';
import { z } from 'zod';


// Validation schemas
export const registerSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email('Please include a valid email'),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  role: z.enum(['buyer', 'seller'], { message: 'Role must be either buyer or seller' }),
  phone: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Please include a valid email' }),
  password: z.string().min(1, { message: 'Password is required' })
});

// Validation middleware
export const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync(req.body);
    return next();
  } catch (error) {
    return res.status(400).json({
      errors: error.errors.map(err => ({
        msg: err.message,
        path: err.path.join('.')
      }))
    });
  }
};

export const authenticateUser = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Role-based middleware
export const isSeller = (req, res, next) => {
  if (req.user && req.user.role === 'seller') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Seller role required' });
  }
};

export const isBuyer = (req, res, next) => {
  if (req.user && req.user.role === 'buyer') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Buyer role required' });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required' });
  }
};




export const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.user.role)) {
      return res.status(403).json({ msg: "Access denied: Insufficient role" });
    }
    next();
  };
};




export const authenticateToken = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
