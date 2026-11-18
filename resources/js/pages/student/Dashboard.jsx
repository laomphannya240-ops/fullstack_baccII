import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    ClipboardList,
    Landmark,
    LibraryBig,
    PlayCircle,
    Sparkles,
    TrendingUp,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge, ErrorState, LoadingState, PageHeader, StatCard } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { api, getErrorMessage, unwrap } from '../../lib/api';

function ProgressBar({ value, label }) {
    return (
        <div>
            <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300">{label}</span>
                <span className="font-semibold">{value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
            </div>
        </div>
    );
}

function trackPath(track) {
    return track?.slug === 'social-science' ? '/app/social-science' : '/app/science';
}

export default function StudentDashboard() {
    usePageTitle('Dashboard');
    const { user } = useAuth();
    const { pick, t, formatDate } = useLocale();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/progress/dashboard')
            .then((response) => setData(unwrap(response)))
            .catch((loadError) => setError(getErrorMessage(loadError)))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <LoadingState label="Loading your dashboard..." />;
    }

    if (error || !data) {
        return <ErrorState message={error || 'Unable to load dashboard.'} />;
    }

    const stats = data.stats || {};
    const tracks = (data.tracks || []).filter((track) => ['science', 'social-science'].includes(track.slug));
    const trackCards = tracks.length > 0 ? tracks : [
        { id: 'science', slug: 'science', name_en: 'Science', name_km: 'វិទ្យាសាស្ត្រ' },
        { id: 'social-science', slug: 'social-science', name_en: 'Social Science', name_km: 'វិទ្យាសាស្ត្រសង្គម' },
    ];

    return (
        <>
            <PageHeader
                title={`${t('Welcome')}, ${user?.name || 'student'}!`}
                description="Choose a track, practise by subject, and use the quick reference sheets to revise before exercises."
                actions={<Link to="/app/exercises" className="btn-primary"><PlayCircle className="size-4" /> {t('Practice Exercises')}</Link>}
            />

            <section className="grid gap-4 md:grid-cols-2">
                {trackCards.map((track) => {
                    const Icon = track.slug === 'science' ? LibraryBig : Landmark;
                    const gradient = track.slug === 'science' ? 'from-brand-700 to-teal-500' : 'from-amber-500 to-rose-500';

                    return (
                        <Link key={track.id} to={trackPath(track)} className={`card group overflow-hidden bg-gradient-to-r ${gradient} p-5 text-white transition hover:-translate-y-0.5 hover:shadow-lg`}>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-white/70">{t('Study track')}</p>
                                    <h2 className="mt-2 text-2xl font-bold">{pick(track, 'name')}</h2>
                                    {track.slug === 'science' && <p className="mt-1 text-sm text-white/80">គណិតវិទ្យា · រូបវិទ្យា · គីមីវិទ្យា</p>}
                                    {track.slug === 'social-science' && <p className="mt-1 text-sm text-white/80">អក្សរសាស្ត្រខ្មែរ · ផែនដី · ភូមិវិទ្យា</p>}
                                </div>
                                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15">
                                    <Icon className="size-6" />
                                </span>
                            </div>
                            <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                                {t('View all')} <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                            </p>
                        </Link>
                    );
                })}
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={ClipboardList} label={t('Total exercises')} value={stats.total_exercises ?? 0} hint={`${stats.completed_exercises ?? 0} attempted`} />
                <StatCard icon={CheckCircle2} label={t('Exercise completion')} value={`${stats.exercise_completion_percentage ?? 0}%`} hint="Unique questions completed" tone="green" />
                <StatCard icon={TrendingUp} label={t('Overall progress')} value={`${data.overall_progress ?? 0}%`} hint={t('Lessons and exercises')} tone="sky" />
                <StatCard icon={BookOpen} label={t('Lessons completed')} value={`${stats.completed_lessons ?? 0}/${stats.total_lessons ?? 0}`} hint={`${stats.lesson_completion_percentage ?? 0}% complete`} tone="violet" />
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="card p-5 lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold">{t('Subjects')}</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t('Choose a subject to see its chapters and practice activities.')}</p>
                        </div>
                        <Sparkles className="size-5 text-brand-600" />
                    </div>
                    {(data.subjects || []).length === 0 ? (
                        <p className="mt-5 text-sm text-slate-500">No subjects are available yet.</p>
                    ) : (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {data.subjects.map((subject) => (
                                <Link key={subject.id} to={`/app/subjects/${subject.id}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-800 dark:hover:border-brand-700 dark:hover:bg-brand-900/10">
                                    <span className="grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: subject.color || '#1f6f5f' }}>
                                        {pick(subject, 'name').charAt(0)}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium">{pick(subject, 'name')}</span>
                                        <span className="block truncate text-xs text-slate-500">{subject.exercises_count ?? 0} exercises · {pick(subject.study_track, 'name')}</span>
                                    </span>
                                    <ArrowRight className="size-4 shrink-0 text-slate-400" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card p-5">
                    <h2 className="text-base font-semibold">{t('Quick practice')}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('Start with a question you have not completed.')}</p>
                    <div className="mt-4 space-y-3">
                        {(data.quick_practice || []).length === 0 ? (
                            <p className="text-sm text-slate-500">You have completed every available exercise. Great work!</p>
                        ) : (
                            data.quick_practice.map((exercise) => (
                                <Link key={exercise.id} to={`/app/exercises?exercise_id=${exercise.id}`} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-brand-300 dark:border-slate-800 dark:hover:border-brand-700">
                                    <PlayCircle className="mt-0.5 size-5 shrink-0 text-brand-600" />
                                    <span className="min-w-0">
                                        <span className="line-clamp-2 block text-sm font-medium">{pick(exercise, 'question')}</span>
                                        <span className="block truncate text-xs text-slate-500">{pick(exercise.subject, 'name')} · {exercise.difficulty}</span>
                                    </span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="card p-5 lg:col-span-2">
                    <h2 className="text-base font-semibold">{t('Recently practiced exercises')}</h2>
                    <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                        {(data.recent_exercises || []).length === 0 ? (
                            <p className="text-sm text-slate-500">{t('Your exercise history will appear here.')}</p>
                        ) : (
                            data.recent_exercises.map((attempt) => (
                                <div key={attempt.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                                    {attempt.is_correct ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-red-500" />}
                                    <div className="min-w-0 flex-1">
                                        <Link to={`/app/exercises?exercise_id=${attempt.exercise_id}`} className="line-clamp-2 text-sm font-medium hover:text-brand-600">
                                            {pick(attempt.exercise, 'question')}
                                        </Link>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {pick(attempt.exercise?.subject, 'name')} · {formatDate(attempt.created_at)}
                                        </p>
                                    </div>
                                    <Badge tone={attempt.is_correct ? 'green' : 'red'}>{attempt.is_correct ? t('Correct') : t('Incorrect')}</Badge>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold">{t('Recently viewed references')}</h2>
                        <Link to="/app/reference" className="text-xs font-semibold text-brand-600 hover:underline">{t('View all')}</Link>
                    </div>
                    <div className="mt-4 space-y-3">
                        {(data.recent_references || []).length === 0 ? (
                            <p className="text-sm text-slate-500">Open a formula or theory sheet to see it here.</p>
                        ) : (
                            data.recent_references.map((reference) => (
                                <Link key={reference.id} to={`/app/lessons/${reference.id}`} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-brand-300 dark:border-slate-800 dark:hover:border-brand-700">
                                    <BookOpen className="mt-0.5 size-5 shrink-0 text-brand-600" />
                                    <span className="min-w-0">
                                        <span className="line-clamp-2 block text-sm font-medium">{pick(reference, 'title')}</span>
                                        <span className="block truncate text-xs text-slate-500">{pick(reference.chapter?.subject, 'name')}</span>
                                    </span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="card p-5">
                    <h2 className="text-base font-semibold">{t('Study activity')}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('Actions in the last 7 days')}</p>
                    <div className="mt-5 h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.activity_chart || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(value) => value.slice(5)} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#2b8b76" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="card p-5">
                    <h2 className="text-base font-semibold">{t('Completion overview')}</h2>
                    <div className="mt-5 space-y-5">
                        <ProgressBar value={stats.exercise_completion_percentage ?? 0} label={t('Exercise completion')} />
                        <ProgressBar value={stats.lesson_completion_percentage ?? 0} label={t('Lesson completion')} />
                        <ProgressBar value={data.overall_progress ?? 0} label={t('Overall progress')} />
                    </div>
                    <Link to="/app/progress" className="btn-secondary mt-6 w-full">
                        {t('My Progress')} <ArrowRight className="size-4" />
                    </Link>
                </div>
            </section>
        </>
    );
}
