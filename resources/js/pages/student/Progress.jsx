import { BookOpen, ClipboardList, Flame, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge, ErrorState, LoadingState, PageHeader, StatCard } from '../../components/ui';
import { useLocale } from '../../contexts/LocaleContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { api, getErrorMessage, unwrap } from '../../lib/api';

export default function StudentProgressPage() {
    usePageTitle('My Progress');
    const { pick, t } = useLocale();
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
        return <LoadingState label="Loading your progress..." />;
    }

    if (error || !data) {
        return <ErrorState message={error || 'Unable to load progress.'} />;
    }

    const stats = data.stats || {};
    const completion = stats.total_lessons ? Math.round((stats.completed_lessons / stats.total_lessons) * 100) : 0;

    return (
        <>
            <PageHeader title={t('Progress')} description="See how much you have covered and where to focus next." />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={BookOpen} label="Lesson completion" value={`${completion}%`} hint={`${stats.completed_lessons} of ${stats.total_lessons} lessons`} />
                <StatCard icon={ClipboardList} label="Quiz average" value={`${stats.quiz_average}%`} hint={`${stats.quiz_attempts} attempts`} tone="sky" />
                <StatCard icon={TrendingUp} label="Exam average" value={`${stats.exam_average}%`} hint={`${stats.exam_attempts} attempts`} tone="gold" />
                <StatCard icon={Flame} label="Exercises solved" value={stats.completed_exercises} tone="violet" />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="card p-5 lg:col-span-2">
                    <h2 className="font-semibold">Study activity</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Actions in the last 7 days</p>
                    <div className="mt-5 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.activity_chart || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(value) => value.slice(5)} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#2b8b76" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card p-5">
                    <h2 className="font-semibold">Focus areas</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Subjects with the lowest averages</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {(data.weak_subjects || []).length === 0 ? (
                            <p className="text-sm text-slate-500">Take a quiz to see focus areas.</p>
                        ) : (
                            data.weak_subjects.map((subject) => <Badge key={subject.subject_id} tone="amber">{subject.name_en} · {subject.average}%</Badge>)
                        )}
                    </div>
                    <h3 className="mt-6 font-semibold">Strong subjects</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {(data.strong_subjects || []).length === 0 ? (
                            <p className="text-sm text-slate-500">No data yet.</p>
                        ) : (
                            data.strong_subjects.map((subject) => <Badge key={subject.subject_id} tone="green">{subject.name_en} · {subject.average}%</Badge>)
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="card p-5">
                    <h2 className="font-semibold">Subject performance</h2>
                    <div className="mt-4 space-y-4">
                        {(data.subject_performance || []).length === 0 ? (
                            <p className="text-sm text-slate-500">Your assessment results will appear here.</p>
                        ) : (
                            data.subject_performance.map((subject) => (
                                <div key={subject.subject_id}>
                                    <div className="mb-1 flex justify-between text-sm">
                                        <span>{pick(subject, 'name')}</span>
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
                    <h2 className="font-semibold">Continue learning</h2>
                    <div className="mt-4 space-y-3">
                        {(data.recommended_lessons || []).length === 0 ? (
                            <p className="text-sm text-slate-500">You have completed all available lessons.</p>
                        ) : (
                            data.recommended_lessons.map((lesson) => (
                                <Link key={lesson.id} to={`/app/lessons/${lesson.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm transition hover:border-brand-300 dark:border-slate-800">
                                    <span className="truncate">{pick(lesson, 'title')}</span>
                                    <span className="shrink-0 text-xs text-slate-500">{lesson.estimated_minutes} min</span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
