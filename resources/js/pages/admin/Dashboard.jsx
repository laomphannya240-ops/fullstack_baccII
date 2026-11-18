import { BookOpen, CalendarClock, ClipboardList, FileText, GraduationCap, LibraryBig, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge, ErrorState, LoadingState, PageHeader, StatCard } from '../../components/ui';
import { useLocale } from '../../contexts/LocaleContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { api, getErrorMessage, unwrap } from '../../lib/api';

export default function AdminDashboard() {
    usePageTitle('Admin Dashboard');
    const { formatDate } = useLocale();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/dashboard')
            .then((response) => setData(unwrap(response)))
            .catch((loadError) => setError(getErrorMessage(loadError)))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <LoadingState label="Loading admin dashboard..." />;
    }

    if (error || !data) {
        return <ErrorState message={error || 'Unable to load dashboard.'} />;
    }

    const counts = data.counts || {};
    const chartData = Object.entries(counts).map(([name, value]) => ({
        name: name.replace('_', ' '),
        value,
    }));

    return (
        <>
            <PageHeader
                title="Admin dashboard"
                description="A snapshot of students, learning content and recent study activity."
                actions={<Link to="/admin/students" className="btn-primary"><UsersRound className="size-4" /> Manage students</Link>}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={UsersRound} label="Students" value={counts.students} hint={`${counts.tracks} study tracks`} />
                <StatCard icon={LibraryBig} label="Subjects" value={counts.subjects} hint={`${counts.chapters} chapters`} tone="sky" />
                <StatCard icon={BookOpen} label="Lessons" value={counts.lessons} hint={`${counts.exercises} exercises`} tone="violet" />
                <StatCard icon={ClipboardList} label="Assessments" value={(counts.quizzes || 0) + (counts.mock_exams || 0)} hint={`${counts.quizzes} quizzes · ${counts.mock_exams} exams`} tone="gold" />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="card p-5 lg:col-span-2">
                    <h2 className="text-base font-semibold">Content overview</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Published records in the study hub</p>
                    <div className="mt-6 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#2b8b76" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card p-5">
                    <h2 className="text-base font-semibold">Quick links</h2>
                    <div className="mt-4 grid gap-2">
                        {[
                            { to: '/admin/subjects', icon: LibraryBig, label: 'Subjects' },
                            { to: '/admin/lessons', icon: BookOpen, label: 'Lessons' },
                            { to: '/admin/exercises', icon: ClipboardList, label: 'Exercises' },
                            { to: '/admin/exams', icon: CalendarClock, label: 'Mock exams' },
                            { to: '/admin/materials', icon: FileText, label: 'Materials' },
                            { to: '/admin/announcements', icon: GraduationCap, label: 'Announcements' },
                        ].map((link) => (
                            <Link key={link.to} to={link.to} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm transition hover:border-brand-300 hover:bg-brand-50 dark:border-slate-800 dark:hover:border-brand-700 dark:hover:bg-brand-900/20">
                                <link.icon className="size-4 text-brand-600" />
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="card overflow-hidden">
                    <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                        <h2 className="text-base font-semibold">Recent students</h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(data.recent_students || []).length === 0 ? (
                            <p className="p-5 text-sm text-slate-500">No students yet.</p>
                        ) : (
                            data.recent_students.map((student) => (
                                <div key={student.id} className="flex items-center justify-between gap-3 px-5 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{student.name}</p>
                                        <p className="truncate text-xs text-slate-500">{student.email}</p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <Badge tone={student.is_active ? 'green' : 'red'}>{student.is_active ? 'Active' : 'Inactive'}</Badge>
                                        <span className="hidden text-xs text-slate-400 sm:block">{formatDate(student.created_at)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="card overflow-hidden">
                    <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                        <h2 className="text-base font-semibold">Recent activity</h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(data.recent_activity || []).length === 0 ? (
                            <p className="p-5 text-sm text-slate-500">Student activity will appear here.</p>
                        ) : (
                            data.recent_activity.map((activity) => (
                                <div key={activity.id} className="px-5 py-3">
                                    <p className="text-sm">{activity.description}</p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {activity.user?.name || 'Student'} · {formatDate(activity.occurred_at)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
