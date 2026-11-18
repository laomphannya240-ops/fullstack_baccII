import { ArrowRight, Bookmark, CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, EmptyState, ErrorState, LoadingState, Modal, PageHeader, Pagination } from '../../components/ui';
import { useLocale } from '../../contexts/LocaleContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { api, getErrorMessage, unwrap, unwrapMeta } from '../../lib/api';

function AnswerChoices({ exercise, value, onChange }) {
    const { pick } = useLocale();

    if (exercise.type === 'mcq' || exercise.type === 'true_false') {
        return (
            <div className="grid gap-2.5">
                {(exercise.options || []).map((option, index) => (
                    <label
                        key={option.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                            String(value) === String(option.id)
                                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                                : 'border-slate-200 dark:border-slate-800'
                        }`}
                    >
                        <input
                            type="radio"
                            name={`practice-${exercise.id}`}
                            checked={String(value) === String(option.id)}
                            onChange={() => onChange(String(option.id))}
                            className="mt-0.5 size-4"
                        />
                        <span className="text-sm">
                            <span className="mr-2 font-semibold text-slate-400">{String.fromCharCode(65 + index)}.</span>
                            {pick(option, 'option')}
                        </span>
                    </label>
                ))}
            </div>
        );
    }

    return (
        <input
            value={value || ''}
            onChange={(event) => onChange(event.target.value)}
            className="input-field"
            placeholder={exercise.type === 'numerical' ? 'Enter a number' : 'Type your answer'}
        />
    );
}

export default function ExercisesPage() {
    usePageTitle('Exercises');
    const { pick, t } = useLocale();
    const toast = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [exercises, setExercises] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);
    const [answer, setAnswer] = useState('');
    const [result, setResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const page = Number(searchParams.get('page') || 1);
    const subjectId = searchParams.get('subject_id') || '';
    const lessonId = searchParams.get('lesson_id') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const type = searchParams.get('type') || '';

    useEffect(() => {
        api.get('/subjects', { params: { per_page: 50 } })
            .then((response) => setSubjects(unwrap(response) || []))
            .catch(() => setSubjects([]));
    }, []);

    useEffect(() => {
        setLoading(true);
        setError('');

        const params = { page, per_page: 12 };
        if (subjectId) params.subject_id = subjectId;
        if (lessonId) params.lesson_id = lessonId;
        if (difficulty) params.difficulty = difficulty;
        if (type) params.type = type;

        api.get('/exercises', { params })
            .then((response) => {
                setExercises(unwrap(response) || []);
                setMeta(unwrapMeta(response));
            })
            .catch((loadError) => setError(getErrorMessage(loadError)))
            .finally(() => setLoading(false));
    }, [page, subjectId, lessonId, difficulty, type]);

    function updateFilter(key, value) {
        const next = new URLSearchParams(searchParams);
        if (value) {
            next.set(key, value);
        } else {
            next.delete(key);
        }
        next.delete('page');
        setSearchParams(next);
    }

    function openExercise(exercise) {
        setSelected(exercise);
        setAnswer('');
        setResult(null);
    }

    async function submitAnswer() {
        if (!selected || !answer) {
            toast.error('Choose or enter an answer first.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await api.post(`/exercises/${selected.id}/submit`, { answer });
            setResult(unwrap(response));
            toast.success('Answer submitted.');
        } catch (submitError) {
            toast.error(getErrorMessage(submitError));
        } finally {
            setSubmitting(false);
        }
    }

    async function toggleBookmark() {
        if (!selected) {
            return;
        }

        try {
            const response = await api.post('/bookmarks/toggle', { type: 'exercise', id: selected.id });
            setSelected((current) => ({ ...current, bookmarked: response.data?.data?.bookmarked }));
            toast.success(response.data?.message || 'Bookmark updated.');
        } catch (bookmarkError) {
            toast.error(getErrorMessage(bookmarkError));
        }
    }

    return (
        <>
            <PageHeader title={t('Exercises')} description="Practise questions from your track. Answers are graded by the server after you submit." />

            <div className="card mb-5 grid gap-3 p-4 sm:grid-cols-4">
                <select value={subjectId} onChange={(event) => updateFilter('subject_id', event.target.value)} className="input-field">
                    <option value="">All subjects</option>
                    {subjects.map((subject) => <option key={subject.id} value={subject.id}>{pick(subject, 'name')}</option>)}
                </select>
                <select value={difficulty} onChange={(event) => updateFilter('difficulty', event.target.value)} className="input-field">
                    <option value="">All difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
                <select value={type} onChange={(event) => updateFilter('type', event.target.value)} className="input-field">
                    <option value="">All types</option>
                    <option value="mcq">Multiple choice</option>
                    <option value="true_false">True / False</option>
                    <option value="short_answer">Short answer</option>
                    <option value="numerical">Numerical</option>
                </select>
                {lessonId && (
                    <button type="button" onClick={() => updateFilter('lesson_id', '')} className="btn-secondary">Clear lesson filter</button>
                )}
            </div>

            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState message={error} />
            ) : exercises.length === 0 ? (
                <EmptyState title={t('No results found')} description="Try a different subject or difficulty." />
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2">
                        {exercises.map((exercise) => (
                            <article key={exercise.id} className="card flex flex-col p-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge tone="brand">{exercise.type?.replace('_', ' ')}</Badge>
                                    {exercise.difficulty && <Badge tone="slate">{exercise.difficulty}</Badge>}
                                    <Badge tone="gold">{exercise.points} pt{exercise.points === 1 ? '' : 's'}</Badge>
                                </div>
                                <p className="mt-3 flex-1 text-sm font-medium leading-relaxed">{pick(exercise, 'question')}</p>
                                <div className="mt-4 flex items-center justify-between gap-2">
                                    <span className="truncate text-xs text-slate-500">{pick(exercise.subject, 'name')}</span>
                                    <button type="button" onClick={() => openExercise(exercise)} className="btn-primary">
                                        Practise <ArrowRight className="size-4" />
                                    </button>
                                </div>
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

            <Modal
                open={Boolean(selected)}
                onClose={() => setSelected(null)}
                title="Practice question"
                size="lg"
                footer={
                    result ? (
                        <button type="button" className="btn-primary" onClick={() => setSelected(null)}>Done</button>
                    ) : (
                        <>
                            <button type="button" className="btn-secondary" onClick={toggleBookmark}>
                                <Bookmark className={`size-4 ${selected?.bookmarked ? 'fill-brand-600 text-brand-600' : ''}`} />
                                {selected?.bookmarked ? 'Bookmarked' : 'Bookmark'}
                            </button>
                            <button type="button" className="btn-primary" onClick={submitAnswer} disabled={submitting || !answer}>
                                {submitting ? 'Submitting...' : 'Submit answer'}
                            </button>
                        </>
                    )
                }
            >
                {selected && (
                    <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="brand">{selected.type?.replace('_', ' ')}</Badge>
                            <span className="text-xs text-slate-500">{pick(selected.subject, 'name')}</span>
                        </div>
                        <p className="text-base font-medium leading-relaxed">{pick(selected, 'question')}</p>
                        {!result && <AnswerChoices exercise={selected} value={answer} onChange={setAnswer} />}

                        {result && (
                            <div className={`rounded-xl border p-4 ${result.is_correct ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40'}`}>
                                <p className={`flex items-center gap-2 font-semibold ${result.is_correct ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                                    {result.is_correct ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
                                    {result.is_correct ? 'Correct!' : 'Not quite — review the explanation.'}
                                </p>
                                {!result.is_correct && (
                                    <p className="mt-2 text-sm">
                                        Correct answer:{' '}
                                        <strong>
                                            {(result.exercise?.options || []).find((option) => option.is_correct)
                                                ? pick((result.exercise.options || []).find((option) => option.is_correct), 'option')
                                                : result.exercise?.correct_answer || '—'}
                                        </strong>
                                    </p>
                                )}
                                {(result.exercise?.explanation_en || result.exercise?.explanation_km) && (
                                    <p className="mt-3 whitespace-pre-line text-sm">{pick(result.exercise, 'explanation')}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}
