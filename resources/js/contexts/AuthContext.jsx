import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, TOKEN_KEY, USER_KEY, unwrap } from '../lib/api';

const AuthContext = createContext(null);

function readStoredUser() {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(readStoredUser);
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const [initializing, setInitializing] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

    const persistSession = useCallback((sessionUser, sessionToken) => {
        localStorage.setItem(TOKEN_KEY, sessionToken);
        localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
        setUser(sessionUser);
        setToken(sessionToken);
    }, []);

    const clearSession = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setToken(null);
    }, []);

    const refreshUser = useCallback(async () => {
        if (!localStorage.getItem(TOKEN_KEY)) {
            return null;
        }

        const response = await api.get('/me');
        const currentUser = unwrap(response);
        setUser(currentUser);
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));

        return currentUser;
    }, []);

    useEffect(() => {
        let cancelled = false;

        refreshUser()
            .catch(() => {
                if (!cancelled) {
                    clearSession();
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setInitializing(false);
                }
            });

        const onUnauthorized = () => {
            clearSession();
        };

        window.addEventListener('auth:unauthorized', onUnauthorized);

        return () => {
            cancelled = true;
            window.removeEventListener('auth:unauthorized', onUnauthorized);
        };
    }, [clearSession, refreshUser]);

    const login = useCallback(
        async (credentials) => {
            const response = await api.post('/login', credentials);
            const payload = response.data?.data || {};
            persistSession(payload.user, payload.token);

            return payload.user;
        },
        [persistSession],
    );

    const register = useCallback(
        async (details) => {
            const response = await api.post('/register', details);
            const payload = response.data?.data || {};
            persistSession(payload.user, payload.token);

            return payload.user;
        },
        [persistSession],
    );

    const logout = useCallback(async () => {
        try {
            await api.post('/logout');
        } finally {
            clearSession();
        }
    }, [clearSession]);

    const updateProfile = useCallback(
        async (details) => {
            const response = await api.put('/profile', details, details instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
            const currentUser = unwrap(response) || user;
            setUser(currentUser);
            localStorage.setItem(USER_KEY, JSON.stringify(currentUser));

            return currentUser;
        },
        [user],
    );

    const value = useMemo(
        () => ({
            user,
            token,
            initializing,
            isAuthenticated: Boolean(token && user),
            isAdmin: user?.role === 'admin',
            isStudent: user?.role === 'student',
            login,
            register,
            logout,
            refreshUser,
            updateProfile,
            clearSession,
        }),
        [user, token, initializing, login, register, logout, refreshUser, updateProfile, clearSession],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return context;
}
