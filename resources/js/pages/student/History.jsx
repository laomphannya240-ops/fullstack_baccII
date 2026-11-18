import { History as HistoryIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, EmptyState, ErrorState, LoadingState, PageHeader } from '../../components/ui';
import { useLocale } from '../../contexts/LocaleContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { api, getErrorMessage, unwrap } from '../../lib/api';

const tabs = [
    { key: 'exercise_attempts', label: 'Exercises' },
    { key: 'quiz_attempts', label: 'Quizzes' },
    { key: 'exam_attempts', label: 'Mock exams' },
    { key: 'lesson_progress', label: 'Lessons' },
];

export default function HistoryPage() {
    usePageTitle('History');
    const { pick, formatDate } = useLocale();
    const [data, setData] = useState(null);
    const [tab, setTab] = useState('exercise_attempts');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/progress/history')
            .then((response) => setData(unwrap(response) || {}))
            .catch((loadError) => setError(getErrorMessage(loadError)))
            .finally(() => setLoading(false));
    }, []);

    const rows = data?.[tab] || [];

    return (
        <>
            <PageHeader title="Study history" description="Review your recent attempts and completed lessons." />
            <div className="mb-5 flex flex-wrap gap-2">
                {tabs.map((item) => (
                    <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`chip ${tab === item.key ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                        {item.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState message={error} />
            ) : rows.length === 0 ? (
                <EmptyState title="No records yet" description="Your activity will appear here as you study." />
            ) : (
                <div className="card overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Item</th>
                                <th className="px-4 py-3 font-semibold">Subject</th>
                                <th className="px-4 py-3 font-semibold">Result</th>
                                <th className="px-4 py-3 font-semibold">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {rows.map((row) => {
                                const item = row.exercise || row.quiz || row.mock_exam || row.lesson;
                                const subject = row.exercise?.subject || row.quiz?.subject || row.mock_exam?.subject || row.lesson?.chapter?.subject;
                                const result = row.is_correct === true
                                    ? <Badge tone="green">Correct</Badge>
                                    : row.is_correct === false
                                        ? <Badge tone="red">Incorrect</Badge>
                                        : row.score !== undefined
                                            ? <Badge tone={row.score / (row.max_score || 1) >= 0.7 ? 'green' : 'amber'}>{row.score}/{row.max_score}</Badge>
                                            : row.is_completed
                                                ? <Badge tone="green">Completed</Badge>
                                                : <Badge tone="slate">In progress</Badge>;

                                return (
                                    <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                        <td className="px-4 py-3">
                                            {item && row.lesson ? (
                                                <Link to={`/app/lessons/${item.id}`} className="font-medium hover:text-brand-600">{pick(item, 'title')}</Link>
                                            ) : (
                                                <span className="line-clamp-1 font-medium">{pick(item || {}, 'question') || pick(item || {}, 'title') || '—'}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{pick(subject, 'name') || '—'}</td>
                                        <td className="px-4 py-3">{result}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(row.created_at || row.submitted_at || row.updated_at)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <p className="mt-5 flex items-center gap-2 text-xs text-slate-400">
                <HistoryIcon className="size-4" /> Showing your most recent 20 records per category.
            </p>
        </>
    );
}
