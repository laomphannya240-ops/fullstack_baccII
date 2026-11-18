import {
    ArrowRight,
    BookOpenCheck,
    CalendarClock,
    ClipboardList,
    Globe2,
    GraduationCap,
    ShieldCheck,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, LoadingState } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import { api, unwrap } from '../../lib/api';

const features = [
    {
        icon: BookOpenCheck,
        title: 'Bilingual lessons',
        description: 'Read every lesson in Khmer or English, with clear explanations and formulas.',
        tone: 'brand',
    },
    {
        icon: ClipboardList,
        title: 'Practice that tests you',
        description: 'Work through exercises and quizzes with instant, server-checked feedback.',
        tone: 'sky',
    },
    {
        icon: CalendarClock,
        title: 'BAC II mock exams',
        description: 'Timed exam simulations that mirror the real Grade 12 experience.',
        tone: 'gold',
    },
    {
        icon: TrendingUp,
        title: 'Track your progress',
        description: 'See completed lessons, scores and weak areas to focus your revision.',
        tone: 'violet',
    },
];

export default function Home() {
    const { isAuthenticated, isAdmin } = useAuth();
    const { locale, pick, t } = useLocale();
    const [tracks, setTracks] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const dashboardLink = isAuthenticated ? (isAdmin ? '/admin' : '/app') : '/register';

    useEffect(() => {
        Promise.all([
            api.get('/tracks'),
            api.get('/subjects', { params: { per_page: 50 } }),
        ])
            .then(([trackResponse, subjectResponse]) => {
                setTracks(unwrap(trackResponse) || []);
                setSubjects(unwrap(subjectResponse) || []);
            })
            .catch(() => {
                setTracks([]);
                setSubjects([]);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <section className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(43,139,118,0.16),transparent_40%),radial-gradient(circle_at_85%_30%,rgba(224,169,46,0.14),transparent_35%)]" />
                <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
                    <div>
                        <Badge tone="brand">
                            <Sparkles className="size-3.5" /> Built for Cambodian Grade 12 students
                        </Badge>
                        <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                            Master every subject.<br />
                            <span className="bg-gradient-to-r from-brand-600 to-teal-500 bg-clip-text text-transparent">
                                Pass BAC II with confidence.
                            </span>
                        </h1>
                        <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
                            A bilingual study hub with lessons, exercises, quizzes and realistic mock exams for both Science and Social Science tracks — completely free to start.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link to={dashboardLink} className="btn-primary px-5 py-3 text-base">
                                {isAuthenticated ? t('Dashboard') : 'Start studying'} <ArrowRight className="size-4" />
                            </Link>
                            <Link to="/subjects" className="btn-secondary px-5 py-3 text-base">
                                Browse subjects
                            </Link>
                        </div>
                        <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-brand-600" /> Secure accounts</span>
                            <span className="inline-flex items-center gap-2"><Globe2 className="size-4 text-brand-600" /> ខ្មែរ + English</span>
                            <span className="inline-flex items-center gap-2"><GraduationCap className="size-4 text-brand-600" /> 8 core subjects</span>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="card rotate-1 p-5 shadow-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Today’s plan</p>
                                    <p className="mt-1 text-lg font-bold">Physics · Motion</p>
                                </div>
                                <Badge tone="amber">Day 12</Badge>
                            </div>
                            <div className="mt-5 space-y-3">
                                {[
                                    { label: 'Read lesson: Newton’s Laws', value: 100, color: 'bg-brand-500' },
                                    { label: 'Complete 10 exercises', value: 70, color: 'bg-sky-500' },
                                    { label: 'Quiz: Forces & Motion', value: 35, color: 'bg-amber-500' },
                                ].map((item) => (
                                    <div key={item.label}>
                                        <div className="mb-1 flex justify-between text-xs">
                                            <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                                            <span className="font-semibold">{item.value}%</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                            <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card absolute -bottom-8 -left-4 w-56 -rotate-2 p-4 shadow-xl sm:left-6">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Mock exam score</p>
                            <p className="mt-1 text-3xl font-bold text-brand-600">86<span className="text-base text-slate-400">/100</span></p>
                            <p className="mt-1 text-xs text-emerald-600">↑ 12 points this month</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="text-center">
                    <Badge tone="gold">Choose your path</Badge>
                    <h2 className="mt-4 text-3xl font-bold">Two tracks, one focused study space</h2>
                    <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                        Administrators can adjust tracks and subjects at any time. Demo content is provided for practice and is not official exam material.
                    </p>
                </div>
                {loading ? (
                    <LoadingState />
                ) : (
                    <div className="mt-10 grid gap-6 md:grid-cols-2">
                        {tracks.map((track) => {
                            const trackSubjects = subjects.filter((subject) => subject.study_track?.slug === track.slug);
                            const gradient = track.slug === 'social-science'
                                ? 'from-amber-500 to-rose-500'
                                : 'from-brand-600 to-teal-500';

                            return (
                                <div key={track.id} className="card overflow-hidden">
                                    <div className={`bg-gradient-to-r p-5 text-white ${gradient}`}>
                                        <h3 className="text-xl font-bold">{pick(track, 'name')}</h3>
                                        <p className="text-sm text-white/85">{track.name_km}</p>
                                    </div>
                                    <div className="p-5">
                                        <p className="text-sm text-slate-600 dark:text-slate-300">
                                            {pick(track, 'description') || 'Grade 12 subjects and practice activities.'}
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {trackSubjects.map((subject) => (
                                                <span key={subject.id} className="chip bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                    {pick(subject, 'name')}
                                                </span>
                                            ))}
                                        </div>
                                        <Link to={`/subjects?track_slug=${track.slug}`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
                                            {locale === 'km' ? 'មើលមុខវិជ្ជា' : 'Explore subjects'} <ArrowRight className="size-4" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="border-y border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold">Everything you need to revise</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Practice actively, get feedback, and return to the topics that need more work.</p>
                    <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature) => (
                            <div key={feature.title} className="card p-5">
                                <div className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                                    <feature.icon className="size-5" />
                                </div>
                                <h3 className="mt-4 text-base">{feature.title}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-teal-600 px-6 py-12 text-center text-white sm:px-12">
                    <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-white/10 blur-2xl" />
                    <h2 className="relative text-3xl font-bold sm:text-4xl">Ready to start your revision?</h2>
                    <p className="relative mx-auto mt-3 max-w-xl text-sm text-brand-50/90">
                        Create a free student account, choose your track, and begin with a subject you want to improve.
                    </p>
                    <Link to={dashboardLink} className="btn-primary relative mt-7 bg-white px-6 py-3 text-base text-brand-700 hover:bg-brand-50">
                        {isAuthenticated ? t('Dashboard') : 'Create free account'} <ArrowRight className="size-4" />
                    </Link>
                </div>
            </section>
        </>
    );
}
