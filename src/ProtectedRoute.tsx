import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
export function ProtectedRoute() { const { user, loading, error } = useAuth(); if (loading) return <p>Restoring session…</p>; if (error) return <p role="alert">{error}</p>; return user ? <Outlet/> : <Navigate to="/login" replace/>; }
