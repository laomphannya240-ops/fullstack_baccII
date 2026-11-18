import { ArrowLeft, ClipboardList, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AssessmentRunner } from '../../components/AssessmentRunner';
import { Badge, EmptyState, ErrorState, LoadingState, PageHeader, Pagination } from '../../components/ui';
import { useLocale } from '../../contexts/LocaleContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { api, getErrorMessage, unwrap, unwrapMeta } from '../../lib/api';

export function QuizzesPage() {
    usePageTitle('Quizzes');
    const { pick, t } = useLocale();
    const toast = useToast();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [quizzes, setQuizzes] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [starting, setStarting] = useState(null);

    const page = Number(searchParams.get('page') || 1);
    const subjectId = searchParams.get('subject_id') || '';

    useEffect(() => {
        api.get('/subjects', { params: { per_page: 50 } })
            .then((response) => setSubjects(unwrap(response) || []))
            .catch(() => setSubjects([]));
    }, []);

    useEffect(() => {
        setLoading(true);
        setError('');
        api.get('/quizzes', { params: { page, per_page: 12, subject_id: subjectId || undefined } })
            .then((response) => {
                setQuizzes(unwrap(response) || []);
                setMeta(unwrapMeta(response));
            })
            .catch((loadError) => setError(getErrorMessage(loadError)))
            .finally(() => setLoading(false));
    }, [page, subjectId]);

    async function startQuiz(quiz) {
        setStarting(quiz.id);
        try {
            const response = await api.post(`/quizzes/${quiz.id}/start`, {});
            const attempt = unwrap(response);
            navigate(`/app/quiz-attempts/${attempt.id}`);
        } catch (startError) {
            toast.error(getErrorMessage(startError));
        } finally {
            setStarting(null);
        }
    }

    return (
        <>
            <PageHeader title={t('Quizzes')} description="Test your knowledge with timed quizzes. Results and explanations appear after submission." />
            <div className="card mb-5 p-4">
                <select className="input-field sm:w-72" value={subjectId} onChange={(event) => {
                    const next = new URLSearchParams(searchParams);
                    if (event.target.value) {
                        next.set('subject_id', event.target.value);
                    } else {
                        next.delete('subject_id');
                    }
                    next.delete('page');
                    setSearchParams(next);
                }}>
                    <option value="">All subjects</option>
                    {subjects.map((subject) => <option key={subject.id} value={subject.id}>{pick(subject, 'name')}</option>)}
                </select>
            </div>

            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState message={error} />
            ) : quizzes.length === 0 ? (
                <EmptyState title={t('No results found')} description="No quizzes available for this subject yet." />
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {quizzes.map((quiz) => (
                            <article key={quiz.id} className="card flex flex-col p-5">
                                <Badge tone="brand"><ClipboardList className="size-3.5" /> {pick(quiz.subject, 'name')}</Badge>
                                <h2 className="mt-3 font-semibold">{pick(quiz, 'title')}</h2>
                                <p className="mt-1 flex-1 text-sm text-slate-500 dark:text-slate-400">{pick(quiz, 'description')}</p>
                                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                                    <Badge tone="slate">{quiz.questions_count ?? quiz.question_count ?? 0} questions</Badge>
                                    <Badge tone="slate">{quiz.duration_minutes} min</Badge>
                                    {quiz.best_score > 0 && <Badge tone="green">Best {quiz.best_score}</Badge>}
                                </div>
                                <button type="button" onClick={() => startQuiz(quiz)} className="btn-primary mt-5" disabled={starting === quiz.id}>
                                    <Play className="size-4" /> {starting === quiz.id ? 'Starting...' : t('Start')}
                                </button>
                            </article>
                        ))}
                    </div>
                    <div className="mt-5"><Pagination meta={meta} onPageChange={(next) => {
                        const params = new URLSearchParams(searchParams);
                        params.set('page', String(next));
                        setSearchParams(params);
                    }} /></div>
                </>
            )}
        </>
    );
}

export function QuizAttemptPage() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [attempt, setAttempt] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get(`/quiz-attempts/${attemptId}`)
            .then((response) => setAttempt(unwrap(response)))
            .catch((loadError) => setError(getErrorMessage(loadError)));
    }, [attemptId]);

    async function submit(values) {
        setSubmitting(true);
        try {
            const response = await api.post(`/quiz-attempts/${attemptId}/submit`, { answers: values });
            setAttempt(unwrap(response));
            toast.success('Quiz submitted.');
        } catch (submitError) {
            toast.error(getErrorMessage(submitError));
        } finally {
            setSubmitting(false);
        }
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    if (!attempt) {
        return <LoadingState label="Loading quiz..." />;
    }

    return (
        <>
            <Link to="/app/quizzes" className="mb-5 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600">
                <ArrowLeft className="size-4" /> Back to quizzes
            </Link>
            <AssessmentRunner attempt={attempt} mode="quiz" submitting={submitting} onSubmit={submit} onExit={() => navigate('/app/quizzes')} />
        </>
    );
}
