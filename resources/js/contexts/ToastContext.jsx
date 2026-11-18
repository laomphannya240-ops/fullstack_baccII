import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

const toastStyles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
    error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100',
    info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100',
};

const toastIcons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const push = useCallback(
        (message, type = 'info') => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            setToasts((current) => [...current, { id, message, type }]);
            window.setTimeout(() => dismiss(id), 5000);
        },
        [dismiss],
    );

    const value = useMemo(
        () => ({
            toast: push,
            success: (message) => push(message, 'success'),
            error: (message) => push(message, 'error'),
            info: (message) => push(message, 'info'),
        }),
        [push],
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end">
                {toasts.map((item) => {
                    const Icon = toastIcons[item.type] || Info;

                    return (
                        <div
                            key={item.id}
                            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${toastStyles[item.type]}`}
                            role="status"
                        >
                            <Icon className="mt-0.5 size-4.5 shrink-0" />
                            <span className="flex-1">{item.message}</span>
                            <button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss notification">
                                <X className="size-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }

    return context;
}
