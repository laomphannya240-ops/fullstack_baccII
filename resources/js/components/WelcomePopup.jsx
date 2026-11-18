import { BookOpenCheck, ClipboardList, FileText, GraduationCap, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';

const DISMISSAL_KEY = 'bacii_studyhub.welcome_seen';

function alreadyDismissed() {
    try {
        return sessionStorage.getItem(DISMISSAL_KEY) === '1';
    } catch {
        return false;
    }
}

export default function WelcomePopup() {
    const { initializing, isAuthenticated } = useAuth();
    const { t } = useLocale();
    const [visible, setVisible] = useState(() => !alreadyDismissed());

    useEffect(() => {
        setVisible(!alreadyDismissed());
    }, [initializing, isAuthenticated]);

    if (initializing || isAuthenticated || !visible) {
        return null;
    }

    const dismiss = () => {
        try {
            sessionStorage.setItem(DISMISSAL_KEY, '1');
        } catch {
            // Keep the popup usable even when session storage is unavailable.
        }

        setVisible(false);
    };

    const highlights = [
        { icon: BookOpenCheck, label: t('Bilingual lessons') },
        { icon: ClipboardList, label: t('Practice anytime') },
        { icon: FileText, label: t('Study materials') },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={t('Welcome to BAC II StudyHub')}
        >
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/60 bg-white p-6 shadow-2xl sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                <div className="pointer-events-none absolute -right-16 -top-16 size-52 rounded-full bg-brand-100/80 blur-2xl dark:bg-brand-900/30" />
                <div className="pointer-events-none absolute -bottom-20 -left-14 size-48 rounded-full bg-gold-400/20 blur-2xl" />

                <button
                    type="button"
                    onClick={dismiss}
                    className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    aria-label={t('Close')}
                >
                    <X className="size-5" />
                </button>

                <div className="relative">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                        <Sparkles className="size-3.5" />
                        BAC II · Grade 12
                    </span>

                    <div className="mt-5 grid size-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/25">
                        <GraduationCap className="size-7" />
                    </div>

                    <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                        {t('Welcome to BAC II StudyHub')}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
                        {t('Your free companion for Grade 12 success')}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {t('Learn at your own pace with bilingual lessons, practice questions and revision materials made for Cambodian students.')}
                    </p>

                    <div className="mt-6 grid grid-cols-3 gap-2">
                        {highlights.map(({ icon: Icon, label }) => (
                            <div
                                key={label}
                                className="rounded-2xl border border-slate-200 bg-slate-50/80 px-2 py-3 text-center dark:border-slate-800 dark:bg-slate-800/50"
                            >
                                <Icon className="mx-auto size-5 text-brand-600 dark:text-brand-300" />
                                <p className="mt-2 text-[11px] font-semibold leading-4 text-slate-700 dark:text-slate-200">{label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                        <Link to="/register" onClick={dismiss} className="btn-primary flex-1 justify-center py-3">
                            {t('Register')}
                        </Link>
                        <Link to="/login" onClick={dismiss} className="btn-secondary flex-1 justify-center py-3">
                            {t('Login')}
                        </Link>
                    </div>

                    <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                        {t('Create a free account to save progress and bookmarks.')}
                    </p>
                </div>
            </div>
        </div>
    );
}
