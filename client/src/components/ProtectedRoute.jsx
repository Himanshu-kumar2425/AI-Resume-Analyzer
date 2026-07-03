import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useEffect, useRef } from 'react';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  const toastFired = useRef(false);

  useEffect(() => {
    if (adminOnly && user && user.role !== 'admin' && !toastFired.current) {
      toastFired.current = true;
      toast.error('Access denied.');
    }
  }, [adminOnly, user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
