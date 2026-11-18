import { ArrowLeft, LockKeyhole, Mail, Send } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLocale } from '../../contexts/LocaleContext';
import { useToast } from '../../contexts/ToastContext';
import { api, getErrorMessage } from '../../lib/api';

export function ForgotPassword() {
    const { t } = useLocale();
    const toast = useToast();
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [errors, setErrors] = useState({});

    const onSubmit = async (event) => {
        event.preventDefault();
        setErrors({});

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErrors({ email: 'Enter a valid email address.' });

            return;
        }

        setSubmitting(true);

        try {
            const response = await api.post('/forgot-password', { email });
            setSent(true);
            toast.success(response.data?.message || 'Password reset link sent.');
        } catch (error) {
            if (error?.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error(getErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-md px-4 py-16">
            <div className="card p-7">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600">
                    <ArrowLeft className="size-4" /> {t('Login')}
                </Link>
                <h1 className="mt-5 text-2xl font-bold">Forgot your password?</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">We’ll email you a link to reset it.</p>
                {sent ? (
                    <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
                        Check your inbox for the password reset link.
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="mt-6 space-y-4">
                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">{t('Email')}</label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input-field pl-9" placeholder="you@example.com" />
                            </div>
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email[0] || errors.email}</p>}
                        </div>
                        <button type="submit" className="btn-primary w-full" disabled={submitting}>
                            <Send className="size-4" /> {submitting ? 'Sending...' : 'Send reset link'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export function ResetPassword() {
    const { t } = useLocale();
    const toast = useToast();
    const [params] = useSearchParams();
    const [values, setValues] = useState({
        token: params.get('token') || '',
        email: params.get('email') || '',
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const onSubmit = async (event) => {
        event.preventDefault();
        setErrors({});

        if (values.password.length < 8) {
            setErrors({ password: 'Password must be at least 8 characters.' });

            return;
        }

        if (values.password !== values.password_confirmation) {
            setErrors({ password_confirmation: 'Passwords do not match.' });

            return;
        }

        setSubmitting(true);

        try {
            const response = await api.post('/reset-password', values);
            setDone(true);
            toast.success(response.data?.message || 'Password reset successfully.');
        } catch (error) {
            if (error?.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error(getErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-md px-4 py-16">
            <div className="card p-7">
                <h1 className="text-2xl font-bold">Reset password</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose a strong new password.</p>
                {done ? (
                    <div className="mt-6 space-y-4">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
                            Your password has been reset. You can now sign in.
                        </div>
                        <Link to="/login" className="btn-primary w-full">{t('Login')}</Link>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="mt-6 space-y-4">
                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">{t('Email')}</label>
                            <input id="email" type="email" value={values.email} onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))} className="input-field" />
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email[0] || errors.email}</p>}
                        </div>
                        <div>
                            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">New password</label>
                            <div className="relative">
                                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <input id="password" type="password" value={values.password} onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))} className="input-field pl-9" />
                            </div>
                            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password[0] || errors.password}</p>}
                        </div>
                        <div>
                            <label htmlFor="password_confirmation" className="mb-1.5 block text-sm font-medium">{t('Confirm password')}</label>
                            <input id="password_confirmation" type="password" value={values.password_confirmation} onChange={(event) => setValues((current) => ({ ...current, password_confirmation: event.target.value }))} className="input-field" />
                            {errors.password_confirmation && <p className="mt-1 text-xs text-red-600">{errors.password_confirmation[0] || errors.password_confirmation}</p>}
                        </div>
                        <button type="submit" className="btn-primary w-full" disabled={submitting}>{submitting ? 'Resetting...' : 'Reset password'}</button>
                    </form>
                )}
            </div>
        </div>
    );
}
