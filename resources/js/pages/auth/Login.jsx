import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../lib/api';

export default function Login() {
    const { login } = useAuth();
    const { t } = useLocale();
    const toast = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [values, setValues] = useState({ email: '', password: '', remember: false });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const validate = () => {
        const next = {};

        if (!values.email.trim()) {
            next.email = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
            next.email = 'Enter a valid email address.';
        }

        if (!values.password) {
            next.password = 'Password is required.';
        }

        setErrors(next);

        return Object.keys(next).length === 0;
    };

    const onSubmit = async (event) => {
        event.preventDefault();

        if (!validate()) {
            return;
        }

        setSubmitting(true);

        try {
            const user = await login({ email: values.email, password: values.password });
            toast.success(`Welcome back, ${user.name}!`);
            const destination = location.state?.from?.pathname || (user.role === 'admin' ? '/admin' : '/app');
            navigate(destination, { replace: true });
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-12">
            <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-2 dark:border-slate-800 dark:bg-slate-900">
                <div className="relative hidden bg-gradient-to-br from-brand-700 via-brand-600 to-teal-500 p-10 text-white lg:flex lg:flex-col lg:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-100">BAC II StudyHub</p>
                        <h2 className="mt-6 text-3xl font-bold leading-tight">Learn with confidence.</h2>
                        <p className="mt-3 text-sm leading-relaxed text-brand-50/90">
                            Bilingual lessons, practice exercises, quizzes and mock exams for Cambodia’s Grade 12 Science and Social Science tracks.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-sm backdrop-blur">
                        <p className="font-semibold">Demo accounts</p>
                        <p className="mt-2 font-mono text-xs text-brand-50">student@demo.test / password</p>
                        <p className="font-mono text-xs text-brand-50">admin@demo.test / password</p>
                    </div>
                    <div className="pointer-events-none absolute -bottom-16 -right-16 size-64 rounded-full bg-white/10 blur-2xl" />
                </div>
                <div className="p-7 sm:p-10">
                    <h1 className="text-2xl font-bold">{t('Welcome back')}</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign in to continue your learning journey.</p>
                    <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">{t('Email')}</label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    value={values.email}
                                    onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
                                    className={`input-field pl-9 ${errors.email ? 'border-red-500' : ''}`}
                                    placeholder="you@example.com"
                                />
                            </div>
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                        </div>
                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <label htmlFor="password" className="text-sm font-medium">{t('Password')}</label>
                                <Link to="/forgot-password" className="text-xs font-medium text-brand-600 hover:underline">
                                    {t('Forgot password?')}
                                </Link>
                            </div>
                            <div className="relative">
                                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={values.password}
                                    onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
                                    className={`input-field px-9 ${errors.password ? 'border-red-500' : ''}`}
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600" aria-label="Toggle password visibility">
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                        </div>
                        <label className="flex items-center gap-2.5 text-sm">
                            <input
                                type="checkbox"
                                checked={values.remember}
                                onChange={(event) => setValues((current) => ({ ...current, remember: event.target.checked }))}
                                className="size-4 rounded border-slate-300 text-brand-600"
                            />
                            {t('Remember me')}
                        </label>
                        <button type="submit" className="btn-primary w-full" disabled={submitting}>
                            {submitting ? 'Signing in...' : t('Login')}
                        </button>
                    </form>
                    <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        {t('Don’t have an account?')}{' '}
                        <Link to="/register" className="font-semibold text-brand-600 hover:underline">
                            {t('Register')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
