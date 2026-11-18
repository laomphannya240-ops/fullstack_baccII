import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, LoaderCircle, X } from 'lucide-react';
import { useEffect } from 'react';

export function LoadingState({ label = 'Loading...' }) {
    return (
        <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <LoaderCircle className="size-5 animate-spin text-brand-600" />
            <span>{label}</span>
        </div>
    );
}

export function ErrorState({ message = 'Unable to load this content.', onRetry }) {
    return (
        <div className="card flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertTriangle className="size-8 text-amber-500" />
            <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
            {onRetry && (
                <button type="button" onClick={onRetry} className="btn-secondary">
                    Try again
                </button>
            )}
        </div>
    );
}

export function EmptyState({ title = 'No results found', description, action }) {
    return (
        <div className="card flex min-h-48 flex-col items-center justify-center gap-2 p-6 text-center">
            <Inbox className="size-8 text-slate-400" />
            <h3 className="text-base">{title}</h3>
            {description && <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>}
            {action}
        </div>
    );
}

export function PageHeader({ title, description, actions }) {
    return (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
                {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}

export function Card({ children, className = '' }) {
    return <section className={`card p-5 ${className}`.trim()}>{children}</section>;
}

export function Button({ children, variant = 'primary', type = 'button', className = '', ...props }) {
    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
    };

    return (
        <button type={type} className={`${variants[variant] || variants.primary} ${className}`.trim()} {...props}>
            {children}
        </button>
    );
}

export function Input({ label, error, hint, required, className = '', ...props }) {
    return (
        <label className="block">
            {label && (
                <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label}
                    {required && <span className="ml-0.5 text-red-500">*</span>}
                </span>
            )}
            <input {...props} className={`input-field ${error ? 'border-red-500' : ''} ${className}`.trim()} />
            {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
            {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
        </label>
    );
}

export function Select({ label, error, hint, required, children, className = '', ...props }) {
    return (
        <label className="block">
            {label && (
                <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label}
                    {required && <span className="ml-0.5 text-red-500">*</span>}
                </span>
            )}
            <select {...props} className={`input-field ${error ? 'border-red-500' : ''} ${className}`.trim()}>
                {children}
            </select>
            {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
            {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
        </label>
    );
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'brand' }) {
    const tones = {
        brand: 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
        gold: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        sky: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
        violet: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    };

    return (
        <div className="card flex items-start gap-4 p-5">
            {Icon && (
                <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${tones[tone] || tones.brand}`}>
                    <Icon className="size-5" />
                </div>
            )}
            <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value ?? '—'}</p>
                {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
            </div>
        </div>
    );
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    const widths = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-3xl',
        xl: 'max-w-5xl',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6">
            <div
                className={`max-h-[92vh] w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-slate-900 ${widths[size]}`}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <h2 className="text-lg">{title}</h2>
                    <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
                        <X className="size-5" />
                    </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
                {footer && <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">{footer}</div>}
            </div>
        </div>
    );
}

export function Pagination({ meta, onPageChange }) {
    if (!meta || meta.last_page <= 1) {
        return null;
    }

    const pages = [];
    const start = Math.max(1, meta.current_page - 2);
    const end = Math.min(meta.last_page, start + 4);

    for (let page = start; page <= end; page += 1) {
        pages.push(page);
    }

    return (
        <nav className="mt-6 flex flex-wrap items-center justify-between gap-3" aria-label="Pagination">
            <p className="text-xs text-slate-500 dark:text-slate-400">
                Page {meta.current_page} of {meta.last_page} · {meta.total} total
            </p>
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    className="btn-secondary px-2.5 py-2"
                    disabled={meta.current_page <= 1}
                    onClick={() => onPageChange(meta.current_page - 1)}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="size-4" />
                </button>
                {pages.map((page) => (
                    <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        className={`size-9 rounded-lg text-sm font-medium transition ${
                            page === meta.current_page
                                ? 'bg-brand-600 text-white'
                                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                    >
                        {page}
                    </button>
                ))}
                <button
                    type="button"
                    className="btn-secondary px-2.5 py-2"
                    disabled={meta.current_page >= meta.last_page}
                    onClick={() => onPageChange(meta.current_page + 1)}
                    aria-label="Next page"
                >
                    <ChevronRight className="size-4" />
                </button>
            </div>
        </nav>
    );
}

export function Badge({ children, tone = 'slate' }) {
    const tones = {
        slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        brand: 'bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200',
        green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
        amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
        red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200',
        sky: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
    };

    return <span className={`chip ${tones[tone] || tones.slate}`}>{children}</span>;
}
