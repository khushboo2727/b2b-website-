import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children, allowedRoles, allowPending = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Redirect pending sellers away from protected seller routes unless explicitly allowed
  if (
    user?.role === 'seller' &&
    user?.status === 'pending' &&
    !allowPending
  ) {
    return <Navigate to="/seller/pending-approval" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;