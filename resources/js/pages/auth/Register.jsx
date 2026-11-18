import { Eye, EyeOff, GraduationCap, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import { useToast } from '../../contexts/ToastContext';
import { api, getErrorMessage, unwrap } from '../../lib/api';

const fallbackTracks = [
    { id: 1, name_en: 'Science', name_km: 'វិទ្យាសាស្ត្រ' },
    { id: 2, name_en: 'Social Science', name_km: 'វិទ្យាសាស្ត្រសង្គម' },
];

export default function Register() {
    const { register } = useAuth();
    const { pick, t } = useLocale();
    const toast = useToast();
    const navigate = useNavigate();
    const [tracks, setTracks] = useState(fallbackTracks);
    const [values, setValues] = useState({ name: '', email: '', study_track_id: '', password: '', password_confirmation: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.get('/tracks')
            .then((response) => {
                const items = unwrap(response);
                if (Array.isArray(items) && items.length > 0) {
                    setTracks(items);
                }
            })
            .catch(() => {});
    }, []);

    const validate = () => {
        const next = {};

        if (values.name.trim().length < 2) {
            next.name = 'Name must be at least 2 characters.';
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
            next.email = 'Enter a valid email address.';
        }

        if (!values.study_track_id) {
            next.study_track_id = 'Please select a track.';
        }

        if (values.password.length < 8) {
            next.password = 'Password must be at least 8 characters.';
        }

        if (values.password !== values.password_confirmation) {
            next.password_confirmation = 'Passwords do not match.';
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
            await register(values);
            toast.success('Your account is ready. Welcome to BAC II StudyHub!');
            navigate('/app', { replace: true });
        } catch (error) {
            const responseErrors = error?.response?.data?.errors;

            if (responseErrors) {
                setErrors(responseErrors);
            }

            toast.error(getErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    };

    const field = (name, label, type = 'text', Icon = null, placeholder = '') => (
        <div>
            <label htmlFor={name} className="mb-1.5 block text-sm font-medium">
                {label}
            </label>
            <div className="relative">
                {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />}
                <input
                    id={name}
                    name={name}
                    type={type}
                    value={values[name]}
                    placeholder={placeholder}
                    onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
                    className={`input-field ${Icon ? 'pl-9' : ''} ${errors[name] ? 'border-red-500' : ''}`}
                />
            </div>
            {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name][0] || errors[name]}</p>}
        </div>
    );

    return (
        <div className="mx-auto max-w-xl px-4 py-12">
            <div className="card p-7 sm:p-9">
                <div className="mb-7 text-center">
                    <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-600 text-white">
                        <GraduationCap className="size-6" />
                    </div>
                    <h1 className="mt-4 text-2xl font-bold">{t('Create your account')}</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Join thousands of Grade 12 students preparing for the BAC II exam.</p>
                </div>
                <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
                    <div className="sm:col-span-2">{field('name', t('Full name'), 'text', UserRound, 'Sokha Dara')}</div>
                    <div className="sm:col-span-2">{field('email', t('Email'), 'email', Mail, 'you@example.com')}</div>
                    <div className="sm:col-span-2">
                        <label htmlFor="study_track_id" className="mb-1.5 block text-sm font-medium">{t('Select your track')}</label>
                        <select
                            id="study_track_id"
                            value={values.study_track_id}
                            onChange={(event) => setValues((current) => ({ ...current, study_track_id: event.target.value }))}
                            className={`input-field ${errors.study_track_id ? 'border-red-500' : ''}`}
                        >
                            <option value="">—</option>
                            {tracks.map((track) => (
                                <option key={track.id} value={track.id}>
                                    {pick(track, 'name')}
                                </option>
                            ))}
                        </select>
                        {errors.study_track_id && <p className="mt-1 text-xs text-red-600">{errors.study_track_id[0] || errors.study_track_id}</p>}
                    </div>
                    <div>
                        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">{t('Password')}</label>
                        <div className="relative">
                            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={values.password}
                                onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
                                className={`input-field pl-9 ${errors.password ? 'border-red-500' : ''}`}
                                placeholder="At least 8 characters"
                            />
                            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400" aria-label="Toggle password visibility">
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password[0] || errors.password}</p>}
                    </div>
                    <div>{field('password_confirmation', t('Confirm password'), 'password', LockKeyhole, '••••••••')}</div>
                    <button type="submit" className="btn-primary col-span-full mt-2" disabled={submitting}>
                        {submitting ? 'Creating account...' : t('Register')}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t('Already have an account?')}{' '}
                    <Link to="/login" className="font-semibold text-brand-600 hover:underline">
                        {t('Login')}
                    </Link>
                </p>
            </div>
        </div>
    );
}
