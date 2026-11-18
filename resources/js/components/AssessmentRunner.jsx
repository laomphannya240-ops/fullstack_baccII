import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Send, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, EmptyState } from './ui';
import { useLocale } from '../contexts/LocaleContext';

function formatRemaining(milliseconds) {
    if (milliseconds <= 0) {
        return '00:00';
    }

    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function AnswerEditor({ exercise, value, onChange, onSave }) {
    const { pick, t } = useLocale();

    if (exercise.type === 'mcq' || exercise.type === 'true_false') {
        return (
            <div className="grid gap-2.5">
                {(exercise.options || []).map((option, index) => (
                    <label
                        key={option.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                            String(value) === String(option.id)
                                ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/30'
                                : 'border-slate-200 hover:border-brand-300 dark:border-slate-800 dark:hover:border-brand-700'
                        }`}
                    >
                        <input
                            type="radio"
                            name={`question-${exercise.id}`}
                            value={option.id}
                            checked={String(value) === String(option.id)}
                            onChange={() => {
                                onChange(String(option.id));
                                onSave?.(String(option.id));
                            }}
                            className="mt-0.5 size-4 text-brand-600"
                        />
                        <span className="text-sm leading-relaxed">
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
            type="text"
            value={value || ''}
            onChange={(event) => {
                onChange(event.target.value);
                onSave?.(event.target.value);
            }}
            className="input-field"
            placeholder={exercise.type === 'numerical' ? 'Enter a number' : 'Type your answer'}
            aria-label={t('Your answer')}
        />
    );
}

function ReviewCard({ answer, number }) {
    const { pick, t } = useLocale();
    const exercise = answer.exercise || {};
    const correctOption = (exercise.options || []).find((option) => option.is_correct);

    return (
        <div className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold dark:bg-slate-800">
                        {number}
                    </span>
                    <div>
                        <p className="font-medium">{pick(exercise, 'question')}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {exercise.type?.replace('_', ' ')} · {exercise.points} pt{exercise.points === 1 ? '' : 's'}
                        </p>
                    </div>
                </div>
                <Badge tone={answer.is_correct ? 'green' : 'red'}>
                    {answer.is_correct ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                    {answer.is_correct ? t('Correct') : t('Incorrect')}
                </Badge>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('Your answer')}</p>
                    <p className="mt-1">
                        {(exercise.options || []).find((option) => String(option.id) === String(answer.submitted_answer))
                            ? pick((exercise.options || []).find((option) => String(option.id) === String(answer.submitted_answer)), 'option')
                            : answer.submitted_answer || '—'}
                    </p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-sm dark:bg-emerald-950/40">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{t('Correct answer')}</p>
                    <p className="mt-1">
                        {correctOption ? pick(correctOption, 'option') : exercise.correct_answer || '—'}
                    </p>
                </div>
            </div>
            {(exercise.explanation_en || exercise.explanation_km) && (
                <div className="mt-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('Explanation')}</p>
                    <p className="mt-1 whitespace-pre-line text-slate-600 dark:text-slate-300">{pick(exercise, 'explanation')}</p>
                </div>
            )}
        </div>
    );
}

export function AssessmentRunner({ attempt, mode = 'quiz', submitting = false, onSubmit, onExit, onAnswerSave }) {
    const { pick, t } = useLocale();
    const answers = useMemo(() => attempt?.answers || [], [attempt]);
    const [values, setValues] = useState({});
    const [current, setCurrent] = useState(0);
    const [now, setNow] = useState(Date.now());
    const submittedRef = useRef(false);

    useEffect(() => {
        setValues(
            Object.fromEntries(
                answers.map((answer) => [answer.exercise_id, answer.submitted_answer || '']),
            ),
        );
        setCurrent(0);
        submittedRef.current = false;
    }, [answers]);

    useEffect(() => {
        if (attempt?.status !== 'in_progress' || !attempt.expires_at) {
            return undefined;
        }

        const timer = window.setInterval(() => setNow(Date.now()), 1000);

        return () => window.clearInterval(timer);
    }, [attempt?.status, attempt?.expires_at]);

    const remaining = attempt?.expires_at ? new Date(attempt.expires_at).getTime() - now : 0;
    const expired = attempt?.status === 'in_progress' && attempt.expires_at && remaining <= 0;

    const submit = async () => {
        if (submitting || submittedRef.current) {
            return;
        }

        submittedRef.current = true;

        if (mode === 'quiz') {
            await onSubmit(values);
        } else {
            await onSubmit(values, true);
        }
    };

    useEffect(() => {
        if (expired && attempt?.status === 'in_progress' && !submitting) {
            submit();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expired, attempt?.status, submitting]);

    if (!attempt) {
        return <EmptyState title="No attempt found" />;
    }

    if (attempt.status === 'completed') {
        const passed = attempt.percentage >= (attempt.quiz?.passing_score || attempt.mock_exam?.passing_score || 70);
        const title = pick(attempt.quiz || attempt.mock_exam || {}, 'title');

        return (
            <div className="space-y-5">
                <div className="card overflow-hidden">
                    <div className={`bg-gradient-to-r p-6 text-white ${passed ? 'from-emerald-600 to-brand-600' : 'from-amber-500 to-red-500'}`}>
                        <Badge className="bg-white/20 text-white">{mode === 'quiz' ? t('Quizzes') : t('Mock Exams')}</Badge>
                        <h1 className="mt-3 text-2xl font-bold">{title}</h1>
                        <p className="mt-1 text-sm text-white/90">
                            {passed ? 'Congratulations — you reached the passing score!' : 'Keep practising — review your answers below.'}
                        </p>
                    </div>
                    <div className="grid gap-4 p-6 sm:grid-cols-4">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">{t('Score')}</p>
                            <p className="mt-1 text-2xl font-bold">{attempt.score}/{attempt.max_score}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Percentage</p>
                            <p className="mt-1 text-2xl font-bold">{attempt.percentage}%</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">{t('Correct')}</p>
                            <p className="mt-1 text-2xl font-bold">{attempt.correct_count}/{answers.length}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Result</p>
                            <p className={`mt-1 text-2xl font-bold ${passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {passed ? 'Passed' : 'Retry'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    {answers.map((answer, index) => (
                        <ReviewCard key={answer.id} answer={answer} number={index + 1} />
                    ))}
                </div>
                {onExit && (
                    <button type="button" onClick={onExit} className="btn-secondary">
                        <ArrowLeft className="size-4" /> Back to list
                    </button>
                )}
            </div>
        );
    }

    const question = answers[current]?.exercise;

    if (!question) {
        return <EmptyState title="This attempt has no questions" />;
    }

    const answeredCount = answers.filter((answer) => String(values[answer.exercise_id] || '').length > 0).length;

    return (
        <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
            <div className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                            {mode === 'quiz' ? t('Quizzes') : t('Mock Exams')}
                        </p>
                        <h1 className="mt-1 text-xl font-bold">{pick(attempt.quiz || attempt.mock_exam || {}, 'title')}</h1>
                    </div>
                    <Badge tone={expired ? 'red' : 'amber'}>
                        <Clock3 className="size-3.5" />
                        {formatRemaining(remaining)}
                    </Badge>
                </div>
                <div className="mt-6">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Question {current + 1} of {answers.length}</span>
                        <span>{answeredCount} answered</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${((current + 1) / answers.length) * 100}%` }} />
                    </div>
                    <h2 className="mt-6 text-lg font-semibold leading-relaxed">{pick(question, 'question')}</h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {question.type?.replace('_', ' ')} · {question.points} pt{question.points === 1 ? '' : 's'}
                    </p>
                    <div className="mt-5">
                        <AnswerEditor
                            exercise={question}
                            value={values[question.id]}
                            onChange={(value) => setValues((currentValues) => ({ ...currentValues, [question.id]: value }))}
                            onSave={mode === 'exam' ? (value) => onAnswerSave?.(question.id, value) : undefined}
                        />
                    </div>
                </div>
                <div className="mt-7 flex items-center justify-between gap-3">
                    <button type="button" className="btn-secondary" disabled={current === 0} onClick={() => setCurrent((index) => index - 1)}>
                        <ArrowLeft className="size-4" /> {t('Previous question')}
                    </button>
                    {current < answers.length - 1 ? (
                        <button type="button" className="btn-primary" onClick={() => setCurrent((index) => index + 1)}>
                            {t('Next question')} <ArrowRight className="size-4" />
                        </button>
                    ) : (
                        <button type="button" className="btn-primary" onClick={submit} disabled={submitting}>
                            <Send className="size-4" /> {submitting ? 'Submitting...' : t('Submit')}
                        </button>
                    )}
                </div>
            </div>
            <aside className="card h-fit p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Question navigator</p>
                <div className="mt-3 grid grid-cols-5 gap-2">
                    {answers.map((answer, index) => {
                        const answered = String(values[answer.exercise_id] || '').length > 0;

                        return (
                            <button
                                key={answer.id}
                                type="button"
                                onClick={() => setCurrent(index)}
                                className={`size-8 rounded-lg text-xs font-semibold transition ${
                                    index === current
                                        ? 'bg-brand-600 text-white'
                                        : answered
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                            >
                                {index + 1}
                            </button>
                        );
                    })}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Your answers are kept on this page. The server grades them only after you submit.
                </p>
            </aside>
        </div>
    );
}
