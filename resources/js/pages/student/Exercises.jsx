import { ArrowRight, Bookmark, CheckCircle2, RotateCcw, Search, Trophy, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, EmptyState, ErrorState, LoadingState, Modal, PageHeader, Pagination } from '../../components/ui';
import { useLocale } from '../../contexts/LocaleContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { api, getErrorMessage, unwrap, unwrapMeta } from '../../lib/api';

const typeLabels = {
    mcq: 'Multiple choice',
    true_false: 'True / False',
    short_answer: 'Short answer',
    numerical: 'Math / numerical',
};

const difficultyLabels = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
};

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

function correctAnswerLabel(exercise, pick) {
    const options = exercise?.options || [];
    const correctOption = options.find((option) => option.is_correct);

    if (correctOption) {
        return pick(correctOption, 'option');
    }

    if (exercise?.correct_answer) {
        const matchingOption = options.find((option) => String(option.id) === String(exercise.correct_answer));

        return matchingOption ? pick(matchingOption, 'option') : exercise.correct_answer;
    }

    if (exercise?.accepted_answers?.length) {
        return exercise.accepted_answers.join(' / ');
    }

    return '—';
}

export default function ExercisesPage() {
    usePageTitle('Exercises');
    const { locale, pick, t, formatDate } = useLocale();
    const toast = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [exercises, setExercises] = useState([]);
    const [tracks, setTracks] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);
    const [answer, setAnswer] = useState('');
    const [result, setResult] = useState(null);
    const [attemptHistory, setAttemptHistory] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const page = Number(searchParams.get('page') || 1);
    const search = searchParams.get('search') || '';
    const trackSlug = searchParams.get('track_slug') || '';
    const subjectId = searchParams.get('subject_id') || '';
    const chapterId = searchParams.get('chapter_id') || '';
    const lessonId = searchParams.get('lesson_id') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const exerciseId = searchParams.get('exercise_id') || '';

    const visibleSubjects = trackSlug ? subjects.filter((subject) => subject.study_track?.slug === trackSlug) : subjects;
    const hasFilters = Boolean(search || trackSlug || subjectId || chapterId || difficulty || type || status || lessonId);

    useEffect(() => {
        Promise.all([api.get('/tracks'), api.get('/subjects', { params: { per_page: 50 } })])
            .then(([trackResponse, subjectResponse]) => {
                setTracks(unwrap(trackResponse) || []);
                setSubjects(unwrap(subjectResponse) || []);
            })
            .catch(() => {
                setTracks([]);
                setSubjects([]);
            });
    }, []);

    useEffect(() => {
        if (!subjectId) {
            setChapters([]);
            return undefined;
        }

        let cancelled = false;

        api.get(`/subjects/${subjectId}`)
            .then((response) => {
                if (!cancelled) {
                    setChapters(unwrap(response)?.chapters || []);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setChapters([]);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [subjectId]);

    useEffect(() => {
        setLoading(true);
        setError('');

        const params = { page, per_page: 12 };
        if (search) params.search = search;
        if (trackSlug) params.track_slug = trackSlug;
        if (subjectId) params.subject_id = subjectId;
        if (chapterId) params.chapter_id = chapterId;
        if (lessonId) params.lesson_id = lessonId;
        if (difficulty) params.difficulty = difficulty;
        if (type) params.type = type;
        if (status) params.status = status;

        api.get('/exercises', { params })
            .then((response) => {
                setExercises(unwrap(response) || []);
                setMeta(unwrapMeta(response));
            })
            .catch((loadError) => setError(getErrorMessage(loadError)))
            .finally(() => setLoading(false));
    }, [page, search, trackSlug, subjectId, chapterId, lessonId, difficulty, type, status, reloadKey]);

    useEffect(() => {
        if (!exerciseId) {
            return undefined;
        }

        let cancelled = false;

        api.get(`/exercises/${exerciseId}`)
            .then((response) => {
                if (!cancelled) {
                    setSelected(unwrap(response));
                    setAnswer('');
                    setResult(null);
                }
            })
            .catch((loadError) => toast.error(getErrorMessage(loadError)));

        return () => {
            cancelled = true;
        };
    }, [exerciseId, toast]);

    useEffect(() => {
        if (!selected?.id) {
            setAttemptHistory([]);
            return undefined;
        }

        let cancelled = false;

        api.get('/exercise-attempts', { params: { per_page: 100 } })
            .then((response) => {
                if (!cancelled) {
                    const attempts = unwrap(response) || [];
                    setAttemptHistory(attempts.filter((attempt) => Number(attempt.exercise_id) === Number(selected.id)).slice(0, 8));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setAttemptHistory([]);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [selected?.id, reloadKey]);

    function updateFilter(key, value) {
        const next = new URLSearchParams(searchParams);
        if (value) {
            next.set(key, value);
        } else {
            next.delete(key);
        }

        if (key === 'track_slug') {
            next.delete('subject_id');
            next.delete('chapter_id');
        }

        if (key === 'subject_id') {
            next.delete('chapter_id');
        }

        next.delete('page');
        setSearchParams(next);
    }

    function clearFilters() {
        setSearchParams(new URLSearchParams());
    }

    function openExercise(exercise) {
        setSelected(exercise);
        setAnswer('');
        setResult(null);
    }

    function closeExercise() {
        setSelected(null);
        setAnswer('');
        setResult(null);

        if (exerciseId) {
            const next = new URLSearchParams(searchParams);
            next.delete('exercise_id');
            setSearchParams(next);
        }
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
            setSelected((current) => ({ ...current, is_completed: true }));
            setReloadKey((key) => key + 1);
            toast.success('Answer submitted.');
        } catch (submitError) {
            toast.error(getErrorMessage(submitError));
        } finally {
            setSubmitting(false);
        }
    }

    function retryExercise() {
        setResult(null);
        setAnswer('');
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

    const revealedExercise = result?.exercise || selected;
    const isCompleted = Boolean(selected?.is_completed || attemptHistory.length > 0);

    return (
        <>
            <PageHeader
                title={t('Practice Exercises')}
                description="Filter questions by track, subject, chapter and difficulty. Answers and explanations appear after you submit."
                actions={hasFilters && (
                    <button type="button" onClick={clearFilters} className="btn-secondary">
                        <X className="size-4" /> {t('Clear')}
                    </button>
                )}
            />

            <div className="card mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative sm:col-span-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => updateFilter('search', event.target.value)}
                        placeholder={`${t('Search')} questions...`}
                        className="input-field pl-9"
                    />
                </div>
                <select value={trackSlug} onChange={(event) => updateFilter('track_slug', event.target.value)} className="input-field">
                    <option value="">{t('All tracks')}</option>
                    {tracks.map((track) => <option key={track.id} value={track.slug}>{pick(track, 'name')}</option>)}
                </select>
                <select value={subjectId} onChange={(event) => updateFilter('subject_id', event.target.value)} className="input-field">
                    <option value="">{t('All subjects')}</option>
                    {visibleSubjects.map((subject) => <option key={subject.id} value={subject.id}>{pick(subject, 'name')}</option>)}
                </select>
                <select value={chapterId} onChange={(event) => updateFilter('chapter_id', event.target.value)} className="input-field" disabled={!subjectId}>
                    <option value="">{subjectId ? t('All chapters') : 'Choose a subject first'}</option>
                    {chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{pick(chapter, 'title')}</option>)}
                </select>
                <select value={difficulty} onChange={(event) => updateFilter('difficulty', event.target.value)} className="input-field">
                    <option value="">{t('All difficulty')}</option>
                    {Object.entries(difficultyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <select value={status} onChange={(event) => updateFilter('status', event.target.value)} className="input-field">
                    <option value="">All status</option>
                    <option value="not_completed">Not completed</option>
                    <option value="completed">Completed</option>
                </select>
                <select value={type} onChange={(event) => updateFilter('type', event.target.value)} className="input-field">
                    <option value="">{t('All types')}</option>
                    {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                {lessonId && (
                    <button type="button" onClick={() => updateFilter('lesson_id', '')} className="btn-secondary">
                        <X className="size-4" /> Clear lesson filter
                    </button>
                )}
            </div>

            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
            ) : exercises.length === 0 ? (
                <EmptyState title={t('No results found')} description="Try another subject, chapter or difficulty." action={hasFilters ? <button type="button" onClick={clearFilters} className="btn-secondary">{t('Clear')}</button> : null} />
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2">
                        {exercises.map((exercise) => (
                            <article key={exercise.id} className="card flex flex-col overflow-hidden">
                                {exercise.image_url && (
                                    <img src={exercise.image_url} alt={pick(exercise, 'question')} className="max-h-44 w-full object-cover" />
                                )}
                                <div className="flex flex-1 flex-col p-5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge tone="brand">{typeLabels[exercise.type] || exercise.type?.replace('_', ' ')}</Badge>
                                        {exercise.difficulty && <Badge tone="slate">{difficultyLabels[exercise.difficulty] || exercise.difficulty}</Badge>}
                                        {exercise.is_completed && <Badge tone="green"><CheckCircle2 className="size-3.5" /> {t('Completed')}</Badge>}
                                        <Badge tone="gold">{exercise.points} pt{exercise.points === 1 ? '' : 's'}</Badge>
                                    </div>
                                    <p className="mt-3 flex-1 text-sm font-medium leading-relaxed">{pick(exercise, 'question')}</p>
                                    <p className="mt-2 truncate text-xs text-slate-500">
                                        {pick(exercise.subject, 'name')}{exercise.chapter ? ` · ${pick(exercise.chapter, 'title')}` : ''}
                                    </p>
                                    <div className="mt-4 flex items-center justify-between gap-2">
                                        <span className="text-xs text-slate-500">
                                            {exercise.attempts_count ? `${exercise.attempts_count} ${t('Attempts')}` : t('Not started')}
                                        </span>
                                        <button type="button" onClick={() => openExercise(exercise)} className="btn-primary">
                                            {locale === 'km' ? 'ហាត់' : 'Practice'} <ArrowRight className="size-4" />
                                        </button>
                                    </div>
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
                onClose={closeExercise}
                title={t('Practice Exercises')}
                size="lg"
                footer={
                    result ? (
                        <>
                            <button type="button" className="btn-secondary" onClick={retryExercise}>
                                <RotateCcw className="size-4" /> {t('Retry')}
                            </button>
                            <button type="button" className="btn-primary" onClick={closeExercise}>Done</button>
                        </>
                    ) : (
                        <>
                            <button type="button" className="btn-secondary" onClick={toggleBookmark}>
                                <Bookmark className={`size-4 ${selected?.bookmarked ? 'fill-brand-600 text-brand-600' : ''}`} />
                                {selected?.bookmarked ? 'Bookmarked' : 'Bookmark'}
                            </button>
                            <button type="button" className="btn-primary" onClick={submitAnswer} disabled={submitting || !answer}>
                                {submitting ? 'Submitting...' : t('Submit')}
                            </button>
                        </>
                    )
                }
            >
                {selected && (
                    <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="brand">{typeLabels[selected.type] || selected.type?.replace('_', ' ')}</Badge>
                            <Badge tone="slate">{difficultyLabels[selected.difficulty] || selected.difficulty}</Badge>
                            {isCompleted && <Badge tone="green"><CheckCircle2 className="size-3.5" /> {t('Completed')}</Badge>}
                            <span className="text-xs text-slate-500">{pick(selected.subject, 'name')}</span>
                        </div>
                        <p className="text-base font-medium leading-relaxed">{pick(selected, 'question')}</p>
                        {selected.image_url && (
                            <img src={selected.image_url} alt={pick(selected, 'question')} className="max-h-80 w-full rounded-xl border border-slate-200 object-contain dark:border-slate-800" />
                        )}
                        {!result && <AnswerChoices exercise={selected} value={answer} onChange={setAnswer} />}

                        {result && (
                            <div className={`rounded-xl border p-4 ${result.is_correct ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40'}`}>
                                <p className={`flex items-center gap-2 font-semibold ${result.is_correct ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                                    {result.is_correct ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
                                    {result.is_correct ? 'Correct!' : 'Not quite — review the explanation.'}
                                </p>
                                <p className="mt-2 flex items-center gap-1.5 text-sm">
                                    <Trophy className="size-4" />
                                    {t('Score')}: <strong>{result.points_earned} / {revealedExercise?.points ?? 0}</strong>
                                </p>
                                <p className="mt-2 text-sm">
                                    {t('Correct answer')}: <strong>{correctAnswerLabel(revealedExercise, pick)}</strong>
                                </p>
                                {(revealedExercise?.explanation_en || revealedExercise?.explanation_km) && (
                                    <div className="mt-3">
                                        <p className="text-xs font-bold uppercase tracking-wide">{t('Explanation')}</p>
                                        <p className="mt-1 whitespace-pre-line text-sm">{pick(revealedExercise, 'explanation')}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                            <h3 className="text-sm font-semibold">{t('History')}</h3>
                            {attemptHistory.length === 0 ? (
                                <p className="mt-2 text-xs text-slate-500">No attempts yet for this question.</p>
                            ) : (
                                <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                                    {attemptHistory.map((attempt) => (
                                        <div key={attempt.id} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                                            <span className={`inline-flex items-center gap-1.5 text-xs ${attempt.is_correct ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {attempt.is_correct ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                                                {attempt.is_correct ? t('Correct') : t('Incorrect')}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {String(attempt.submitted_answer ?? '—').slice(0, 40)} · {attempt.points_earned} pt · {formatDate(attempt.created_at)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
