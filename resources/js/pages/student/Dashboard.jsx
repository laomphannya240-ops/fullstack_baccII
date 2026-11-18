import { ArrowRight, BookOpen, CalendarClock, ClipboardList, Flame, PlayCircle, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge, ErrorState, LoadingState, PageHeader, StatCard } from '../../components/ui';
import { useLocale } from '../../contexts/LocaleContext';
import { api, getErrorMessage, unwrap } from '../../lib/api';

export default function StudentDashboard() {
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
    const completionRate = stats.total_lessons > 0 ? Math.round((stats.completed_lessons / stats.total_lessons) * 100) : 0;

    return (
        <>
            <PageHeader
                title="Your learning dashboard"
                description={`Track what you have learned and what to study next. ${data.track ? `Track: ${pick(data.track, 'name')}` : ''}`}
                actions={<Link to="/app/subjects" className="btn-primary">Continue studying <ArrowRight className="size-4" /></Link>}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={BookOpen} label="Lessons completed" value={`${stats.completed_lessons}/${stats.total_lessons}`} hint={`${completionRate}% of available lessons`} />
                <StatCard icon={ClipboardList} label="Quiz attempts" value={stats.quiz_attempts} hint={`Average ${stats.quiz_average}%`} tone="sky" />
                <StatCard icon={CalendarClock} label="Mock exams" value={stats.exam_attempts} hint={`Average ${stats.exam_average}%`} tone="gold" />
                <StatCard icon={Flame} label="Exercises solved" value={stats.completed_exercises} hint="Unique questions attempted" tone="violet" />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="card p-5 lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold">Study activity</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Actions in the last 7 days</p>
                        </div>
                        <TrendingUp className="size-5 text-brand-600" />
                    </div>
                    <div className="mt-6 h-56">
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
                    <h2 className="text-base font-semibold">Recommended for you</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Lessons you have not completed yet</p>
                    <div className="mt-4 space-y-3">
                        {(data.recommended_lessons || []).length === 0 ? (
                            <p className="text-sm text-slate-500">You are all caught up!</p>
                        ) : (
                            data.recommended_lessons.map((lesson) => (
                                <Link key={lesson.id} to={`/app/lessons/${lesson.id}`} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-brand-300 dark:border-slate-800 dark:hover:border-brand-700">
                                    <PlayCircle className="mt-0.5 size-5 shrink-0 text-brand-600" />
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-medium">{pick(lesson, 'title')}</span>
                                        <span className="block truncate text-xs text-slate-500">{pick(lesson.chapter?.subject, 'name')} · {lesson.estimated_minutes} min</span>
                                    </span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="card p-5">
                    <h2 className="text-base font-semibold">Subject performance</h2>
                    <div className="mt-4 space-y-4">
                        {(data.subject_performance || []).length === 0 ? (
                            <p className="text-sm text-slate-500">Take a quiz to see your subject performance.</p>
                        ) : (
                            data.subject_performance.map((subject) => (
                                <div key={subject.subject_id}>
                                    <div className="mb-1 flex justify-between text-sm">
                                        <span>{subject.name_en}</span>
                                        <span className="font-semibold">{subject.average}%</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${subject.average}%` }} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="card p-5">
                    <h2 className="text-base font-semibold">Recent activity</h2>
                    <div className="mt-4 space-y-3">
                        {(data.recent_activity || []).length === 0 ? (
                            <p className="text-sm text-slate-500">Your study activity will appear here.</p>
                        ) : (
                            data.recent_activity.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800">
                                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm">{activity.description}</p>
                                        <p className="text-xs text-slate-500">{formatDate(activity.occurred_at)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Badge tone="green">Strong: {(data.strong_subjects || []).map((item) => item.name_en).join(', ') || '—'}</Badge>
                    </div>
                </div>
            </div>
        </>
    );
}
