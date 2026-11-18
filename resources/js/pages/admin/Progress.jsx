import { BookOpen, ClipboardList, PlayCircle, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ErrorState, LoadingState, PageHeader, StatCard } from '../../components/ui';
import { usePageTitle } from '../../hooks/usePageTitle';
import { api, getErrorMessage, unwrap } from '../../lib/api';

export default function AdminProgress() {
    usePageTitle('Student Progress');
    const [students, setStudents] = useState([]);
    const [studentId, setStudentId] = useState('');
    const [progress, setProgress] = useState(null);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/admin/students', { params: { per_page: 100 } })
            .then((response) => {
                const rows = unwrap(response) || [];
                setStudents(rows);
                if (rows.length > 0) {
                    setStudentId(String(rows[0].id));
                }
            })
            .catch((loadError) => setError(getErrorMessage(loadError)))
            .finally(() => setLoadingStudents(false));
    }, []);

    useEffect(() => {
        if (!studentId) {
            return;
        }

        setLoadingProgress(true);
        setError('');
        api.get(`/admin/students/${studentId}/progress`)
            .then((response) => setProgress(unwrap(response)))
            .catch((loadError) => {
                setProgress(null);
                setError(getErrorMessage(loadError));
            })
            .finally(() => setLoadingProgress(false));
    }, [studentId]);

    const stats = progress?.stats || {};

    return (
        <>
            <PageHeader title="Student progress" description="Inspect learning activity and assessment performance for any student." />
            <div className="card mb-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <label htmlFor="student-select" className="mb-1 block text-sm font-medium">Select student</label>
                    <select id="student-select" value={studentId} onChange={(event) => setStudentId(event.target.value)} className="input-field sm:w-80">
                        {students.map((student) => (
                            <option key={student.id} value={student.id}>
                                {student.name} — {student.email}
                            </option>
                        ))}
                    </select>
                </div>
                {progress?.track && <p className="text-sm text-slate-500">Track: <span className="font-medium">{progress.track.name_en}</span></p>}
            </div>

            {error && <ErrorState message={error} />}
            {loadingStudents || loadingProgress ? (
                <LoadingState />
            ) : !progress ? (
                <p className="text-sm text-slate-500">Choose a student to view progress.</p>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard icon={BookOpen} label="Lessons completed" value={`${stats.completed_lessons}/${stats.total_lessons}`} />
                        <StatCard icon={ClipboardList} label="Quiz attempts" value={stats.quiz_attempts} hint={`Average ${stats.quiz_average}%`} tone="sky" />
                        <StatCard icon={TrendingUp} label="Exam attempts" value={stats.exam_attempts} hint={`Average ${stats.exam_average}%`} tone="gold" />
                        <StatCard icon={PlayCircle} label="Exercises solved" value={stats.completed_exercises} tone="violet" />
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                        <div className="card p-5">
                            <h2 className="font-semibold">Activity (last 7 days)</h2>
                            <div className="mt-5 h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={progress.activity_chart || []}>
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
                            <h2 className="font-semibold">Subject performance</h2>
                            <div className="mt-4 space-y-4">
                                {(progress.subject_performance || []).length === 0 ? (
                                    <p className="text-sm text-slate-500">No assessment data yet.</p>
                                ) : (
                                    progress.subject_performance.map((subject) => (
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
                    </div>
                </>
            )}
        </>
    );
}
