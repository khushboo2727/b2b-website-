// Admin authorization middleware
const adminAuth = (req, res, next) => {
  try {
    // Check if user exists and has admin role
    if (!req.user || !req.user.user) {
      return res.status(401).json({ message: 'Access denied. No user found.' });
    }

    if (req.user.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ message: 'Server error in admin authentication' });
  }
};

export default adminAuth;