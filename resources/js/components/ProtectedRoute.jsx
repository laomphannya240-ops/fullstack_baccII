import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingState } from './ui';

export function ProtectedRoute({ role }) {
    const { initializing, isAuthenticated, isAdmin } = useAuth();
    const location = useLocation();

    if (initializing) {
        return (
            <div className="grid min-h-screen place-items-center">
                <LoadingState label="Restoring your session..." />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (role === 'admin' && !isAdmin) {
        return <Navigate to="/app" replace />;
    }

    if (role === 'student' && isAdmin) {
        return <Navigate to="/admin" replace />;
    }

    return <Outlet />;
}

export function GuestRoute() {
    const { initializing, isAuthenticated, isAdmin } = useAuth();

    if (initializing) {
        return (
            <div className="grid min-h-screen place-items-center">
                <LoadingState />
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to={isAdmin ? '/admin' : '/app'} replace />;
    }

    return <Outlet />;
}
