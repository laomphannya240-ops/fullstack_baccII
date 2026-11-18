import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Bookmark,
    CheckCircle2,
    Circle,
    Download,
    FileText,
    LibraryBig,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import katex from 'katex';
import { Badge, EmptyState, ErrorState, LoadingState, PageHeader } from '../../components/ui';
import { useLocale } from '../../contexts/LocaleContext';
import { useToast } from '../../contexts/ToastContext';
import { api, getErrorMessage, unwrap, unwrapMeta } from '../../lib/api';

function RichContent({ content }) {
    if (!content) {
        return <p className="text-sm text-slate-500">No lesson content available.</p>;
    }

    const parts = content.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/g);

    return (
        <div className="space-y-4 text-sm leading-7 text-slate-700 dark:text-slate-200">
            {parts.map((part, index) => {
                if (part.startsWith('$$') && part.endsWith('$$')) {
                    const html = katex.renderToString(part.slice(2, -2), { displayMode: true, throwOnError: false });

                    return <div key={index} className="overflow-x-auto py-2" dangerouslySetInnerHTML={{ __html: html }} />;
                }

                if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
                    const html = katex.renderToString(part.slice(1, -1), { throwOnError: false });

                    return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
                }

                return <span key={index} className="whitespace-pre-line">{part}</span>;
            })}
        </div>
    );
}

export function StudentSubjects() {
    const { pick, t } = useLocale();
    const [subjects, setSubjects] = useState([]);
    const [tracks, setTracks] = useState([]);
    const [trackId, setTrackId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([api.get('/subjects'), api.get('/tracks')])
            .then(([subjectResponse, trackResponse]) => {
                setSubjects(unwrap(subjectResponse) || []);
                setTracks(unwrap(trackResponse) || []);
            })
            .catch((loadError) => setError(getErrorMessage(loadError)))
            .finally(() => setLoading(false));
    }, []);

    const visible = trackId ? subjects.filter((subject) => String(subject.study_track?.id) === String(trackId)) : subjects;

    return (
        <>
            <PageHeader title={t('Subjects')} description="Choose a subject to see its chapters, lessons and practice activities." />
            <div className="mb-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => setTrackId('')} className={`chip ${trackId === '' ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                    {t('All tracks')}
                </button>
                {tracks.map((track) => (
                    <button
                        key={track.id}
                        type="button"
                        onClick={() => setTrackId(String(track.id))}
                        className={`chip ${String(trackId) === String(track.id) ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                    >
                        {pick(track, 'name')}
                    </button>
                ))}
            </div>
            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState message={error} />
            ) : visible.length === 0 ? (
                <EmptyState title={t('No results found')} />
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map((subject) => (
                        <Link key={subject.id} to={`/app/subjects/${subject.id}`} className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
                            <div className="grid h-20 place-items-center text-2xl font-bold text-white" style={{ background: `linear-gradient(135deg, ${subject.color || '#1f6f5f'}, #0f766e)` }}>
                                {pick(subject, 'name').charAt(0)}
                            </div>
                            <div className="p-5">
                                <h2 className="font-semibold group-hover:text-brand-600">{pick(subject, 'name')}</h2>
                                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{pick(subject, 'description')}</p>
                                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                    <span>{subject.chapters_count ?? '—'} chapters</span>
                                    <span>{pick(subject.study_track, 'name')}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </>
    );
}

export function SubjectOverview() {
    const { id } = useParams();
    const { pick, t } = useLocale();
    const [subject, setSubject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get(`/subjects/${id}`)
            .then((response) => setSubject(unwrap(response)))
            .catch((loadError) => setError(getErrorMessage(loadError)))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return <LoadingState />;
    }

    if (error || !subject) {
        return <ErrorState message={error || 'Subject not found.'} />;
    }

    return (
        <>
            <Link to="/app/subjects" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600">
                <ArrowLeft className="size-4" /> {t('Subjects')}
            </Link>
            <div className="card mt-5 overflow-hidden">
                <div className="p-6 text-white" style={{ background: `linear-gradient(135deg, ${subject.color || '#1f6f5f'}, #0f766e)` }}>
                    <Badge className="bg-white/20 text-white">{pick(subject.study_track, 'name')}</Badge>
                    <h1 className="mt-3 text-3xl font-bold">{pick(subject, 'name')}</h1>
                    <p className="mt-2 max-w-2xl text-sm text-white/90">{pick(subject, 'description')}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        <Link to={`/app/exercises?subject_id=${subject.id}`} className="btn-secondary bg-white/15 text-white hover:bg-white/25">{t('Exercises')}</Link>
                        <Link to={`/app/quizzes?subject_id=${subject.id}`} className="btn-secondary bg-white/15 text-white hover:bg-white/25">{t('Quizzes')}</Link>
                        <Link to={`/app/exams?subject_id=${subject.id}`} className="btn-secondary bg-white/15 text-white hover:bg-white/25">{t('Mock Exams')}</Link>
                    </div>
                </div>
                <div className="p-6">
                    <h2 className="text-lg font-semibold">{t('Chapters')}</h2>
                    {(subject.chapters || []).length === 0 ? (
                        <div className="mt-4"><EmptyState title="No chapters available" /></div>
                    ) : (
                        <div className="mt-4 space-y-5">
                            {subject.chapters.map((chapter, chapterIndex) => (
                                <div key={chapter.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                                            {chapterIndex + 1}
                                        </span>
                                        <div>
                                            <h3 className="font-semibold">{pick(chapter, 'title')}</h3>
                                            <p className="text-xs text-slate-500">{chapter.lessons?.length || 0} lessons</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                        {(chapter.lessons || []).map((lesson) => (
                                            <Link key={lesson.id} to={`/app/lessons/${lesson.id}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm transition hover:bg-brand-50 dark:bg-slate-800/60 dark:hover:bg-slate-800">
                                                <span className="flex items-center gap-2 truncate">
                                                    <BookOpen className="size-4 shrink-0 text-brand-600" />
                                                    <span className="truncate">{pick(lesson, 'title')}</span>
                                                </span>
                                                <ArrowRight className="size-4 shrink-0 text-slate-400" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export function LessonReader() {
    const { id } = useParams();
    const { locale, pick, t } = useLocale();
    const toast = useToast();
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get(`/lessons/${id}`)
            .then((response) => setLesson(unwrap(response)))
            .catch((loadError) => setError(getErrorMessage(loadError)))
            .finally(() => setLoading(false));
    }, [id]);

    const toggleBookmark = async () => {
        try {
            const response = await api.post('/bookmarks/toggle', { type: 'lesson', id: lesson.id });
            setLesson((current) => ({ ...current, bookmarked: response.data?.data?.bookmarked }));
            toast.success(response.data?.message || 'Bookmark updated.');
        } catch (bookmarkError) {
            toast.error(getErrorMessage(bookmarkError));
        }
    };

    const toggleComplete = async () => {
        setSaving(true);

        try {
            const response = await api.post(`/lessons/${lesson.id}/progress`, { is_completed: !lesson.is_completed });
            setLesson((current) => ({ ...current, is_completed: Boolean(response.data?.data?.progress?.is_completed) }));
            toast.success('Progress saved.');
        } catch (progressError) {
            toast.error(getErrorMessage(progressError));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <LoadingState />;
    }

    if (error || !lesson) {
        return <ErrorState message={error || 'Lesson not found.'} />;
    }

    const content = locale === 'km' ? lesson.content_km : lesson.content_en || lesson.content_km;

    return (
        <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <Link to={`/app/subjects/${lesson.chapter?.subject?.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600">
                    <ArrowLeft className="size-4" /> {pick(lesson.chapter?.subject, 'name')}
                </Link>
                <div className="flex gap-2">
                    <button type="button" onClick={toggleBookmark} className="btn-secondary">
                        <Bookmark className={`size-4 ${lesson.bookmarked ? 'fill-brand-600 text-brand-600' : ''}`} />
                        {lesson.bookmarked ? 'Bookmarked' : 'Bookmark'}
                    </button>
                    <button type="button" onClick={toggleComplete} className="btn-primary" disabled={saving}>
                        {lesson.is_completed ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
                        {lesson.is_completed ? 'Completed' : t('Mark complete')}
                    </button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
                <article className="card p-6 sm:p-8">
                    <Badge tone="brand">{pick(lesson.chapter, 'title')}</Badge>
                    <h1 className="mt-4 text-3xl font-bold">{pick(lesson, 'title')}</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{pick(lesson, 'summary')}</p>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>{lesson.estimated_minutes} min read</span>
                        {lesson.has_video && <span>Video available</span>}
                        {lesson.has_pdf && <span>PDF available</span>}
                    </div>
                    <div className="my-7 border-t border-slate-200 dark:border-slate-800" />
                    <RichContent content={content} />
                    {lesson.important_notes && (
                        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
                            <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">Important notes</p>
                            <p className="mt-2 whitespace-pre-line text-sm text-amber-900 dark:text-amber-100">{lesson.important_notes}</p>
                        </div>
                    )}
                    {lesson.video_url && (
                        <a href={lesson.video_url} target="_blank" rel="noreferrer" className="btn-secondary mt-5">
                            Open lesson video <ArrowRight className="size-4" />
                        </a>
                    )}
                    {lesson.pdf_url && (
                        <a href={lesson.pdf_url} target="_blank" rel="noreferrer" className="btn-secondary mt-5">
                            <Download className="size-4" /> Open lesson PDF
                        </a>
                    )}
                    <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                        {lesson.previous ? (
                            <Link to={`/app/lessons/${lesson.previous.id}`} className="btn-secondary"><ArrowLeft className="size-4" /> {pick(lesson.previous, 'title')}</Link>
                        ) : <span />}
                        {lesson.next && (
                            <Link to={`/app/lessons/${lesson.next.id}`} className="btn-primary">{pick(lesson.next, 'title')} <ArrowRight className="size-4" /></Link>
                        )}
                    </div>
                </article>

                <aside className="space-y-4">
                    <div className="card p-5">
                        <h2 className="text-sm font-semibold">Practice this lesson</h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{lesson.exercises?.length || 0} questions available</p>
                        <Link to={`/app/exercises?lesson_id=${lesson.id}`} className="btn-primary mt-4 w-full">
                            Start practising
                        </Link>
                    </div>
                    <div className="card p-5">
                        <h2 className="text-sm font-semibold">In this lesson</h2>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                            <li className="flex items-center gap-2"><BookOpen className="size-4 text-brand-600" /> Bilingual explanation</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-brand-600" /> Key notes</li>
                            <li className="flex items-center gap-2"><FileText className="size-4 text-brand-600" /> Practice questions</li>
                        </ul>
                    </div>
                </aside>
            </div>
        </>
    );
}

export function StudentMaterials() {
    const { pick, t, formatDate } = useLocale();
    const [materials, setMaterials] = useState([]);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        api.get('/materials', { params: { page, per_page: 12 } })
            .then((response) => {
                setMaterials(unwrap(response) || []);
                setMeta(unwrapMeta(response));
            })
            .catch((loadError) => setError(getErrorMessage(loadError)))
            .finally(() => setLoading(false));
    }, [page]);

    return (
        <>
            <PageHeader title={t('Materials')} description="Download demo revision notes and study guides." />
            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState message={error} />
            ) : materials.length === 0 ? (
                <EmptyState title={t('No results found')} />
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {materials.map((material) => (
                        <div key={material.id} className="card flex flex-col p-5">
                            <Badge tone="sky">{material.file_type}</Badge>
                            <h2 className="mt-3 font-semibold">{pick(material, 'title')}</h2>
                            <p className="mt-1 flex-1 text-sm text-slate-500 dark:text-slate-400">{material.description}</p>
                            <p className="mt-3 text-xs text-slate-400">{pick(material.subject, 'name')} · {formatDate(material.created_at)}</p>
                            <a href={material.file_url} target="_blank" rel="noreferrer" className="btn-secondary mt-4">
                                <Download className="size-4" /> {t('Download')}
                            </a>
                        </div>
                    ))}
                </div>
            )}
            {meta && meta.last_page > 1 && (
                <div className="mt-5 flex justify-center gap-2">
                    <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                    <span className="self-center text-sm">Page {meta.current_page} / {meta.last_page}</span>
                    <button type="button" className="btn-secondary" disabled={page >= meta.last_page} onClick={() => setPage(page + 1)}>Next</button>
                </div>
            )}
        </>
    );
}
