import { Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CrudManager } from '../../components/CrudManager';
import { Badge, Modal } from '../../components/ui';
import { useLocale } from '../../contexts/LocaleContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { loadStudents, loadSubjects } from './config';

export default function AdminExerciseResults() {
    usePageTitle('Exercise results');
    const { pick, formatDate } = useLocale();
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [detail, setDetail] = useState(null);

    useEffect(() => {
        loadStudents()
            .then(setStudents)
            .catch(() => setStudents([]));
        loadSubjects()
            .then(setSubjects)
            .catch(() => setSubjects([]));
    }, []);

    return (
        <>
            <CrudManager
                title="Exercise results"
                description="Review every submitted practice answer, score and attempt time across all students."
                endpoint="/admin/exercise-results"
                fields={[]}
                creatable={false}
                editable={false}
                deletable={false}
                columns={[
                    { key: 'student.name', label: 'Student' },
                    { key: 'exercise.question_en', label: 'Question', render: (row) => <span className="line-clamp-2 max-w-md">{pick(row.exercise, 'question')}</span> },
                    { key: 'exercise.subject.name_en', label: 'Subject', render: (row) => pick(row.exercise?.subject, 'name') || '—' },
                    {
                        key: 'is_correct',
                        label: 'Result',
                        render: (row) => <Badge tone={row.is_correct ? 'green' : 'red'}>{row.is_correct ? 'Correct' : 'Incorrect'}</Badge>,
                    },
                    { key: 'points_earned', label: 'Points' },
                    { key: 'created_at', label: 'Attempted', render: (row) => formatDate(row.created_at) },
                ]}
                filters={[
                    { name: 'student_id', label: 'All students', options: students },
                    { name: 'subject_id', label: 'All subjects', options: subjects },
                    {
                        name: 'is_correct',
                        label: 'All results',
                        options: [
                            { value: 'true', label: 'Correct' },
                            { value: 'false', label: 'Incorrect' },
                        ],
                    },
                ]}
                rowActions={(row) => (
                    <button
                        type="button"
                        onClick={() => setDetail(row)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-900/40"
                        aria-label="View result"
                    >
                        <Eye className="size-4" />
                    </button>
                )}
            />

            <Modal
                open={Boolean(detail)}
                onClose={() => setDetail(null)}
                title="Exercise result"
                size="lg"
                footer={<button type="button" className="btn-secondary" onClick={() => setDetail(null)}>Close</button>}
            >
                {detail && (
                    <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={detail.is_correct ? 'green' : 'red'}>{detail.is_correct ? 'Correct' : 'Incorrect'}</Badge>
                            <Badge tone="brand">{detail.exercise?.type?.replace('_', ' ')}</Badge>
                            {detail.exercise?.subject && <Badge tone="slate">{pick(detail.exercise.subject, 'name')}</Badge>}
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Question</p>
                            <p className="mt-1 text-sm leading-relaxed">{pick(detail.exercise, 'question')}</p>
                        </div>
                        {detail.exercise?.image_url && (
                            <img src={detail.exercise.image_url} alt="Exercise" className="max-h-72 w-full rounded-xl border border-slate-200 object-contain dark:border-slate-800" />
                        )}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Student</p>
                                <p className="mt-1 text-sm font-medium">{detail.student?.name}</p>
                                <p className="text-xs text-slate-500">{detail.student?.email}</p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</p>
                                <p className="mt-1 text-sm font-medium">{detail.points_earned} / {detail.exercise?.points ?? 0} points</p>
                                <p className="text-xs text-slate-500">{formatDate(detail.created_at)}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted answer</p>
                            <p className="mt-1 whitespace-pre-line text-sm">{detail.submitted_answer || '—'}</p>
                        </div>
                        {detail.feedback && (
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Feedback</p>
                                <p className="mt-1 text-sm">{detail.feedback}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}
