import { ArrowLeft, BookOpen, Download, FileText, Megaphone, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { useLocale } from '../../contexts/LocaleContext';
import { api, getErrorMessage, unwrap, unwrapMeta } from '../../lib/api';

function usePublicList(endpoint, params = {}) {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const key = JSON.stringify(params);

    const load = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await api.get(endpoint, { params });
            setItems(unwrap(response) || []);
            setMeta(unwrapMeta(response));
        } catch (loadError) {
            setError(getErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endpoint, key]);

    return { items, meta, loading, error, reload: load };
}

export function Subjects() {
    const { locale, pick, t } = useLocale();
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState('');
    const trackSlug = searchParams.get('track_slug') || '';
    const { items, loading, error } = usePublicList('/subjects', {
        search,
        track_slug: trackSlug || undefined,
        per_page: 50,
    });
    const { items: tracks } = usePublicList('/tracks', { per_page: 50 });

    function setTrack(nextSlug) {
        const next = new URLSearchParams(searchParams);
        if (nextSlug) {
            next.set('track_slug', nextSlug);
        } else {
            next.delete('track_slug');
        }
        setSearchParams(next);
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="text-center">
                <Badge tone="brand"><BookOpen className="size-3.5" /> {t('Subjects')}</Badge>
                <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Explore your subjects</h1>
                <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                    Choose a subject to browse chapters, lessons, practice questions and study materials.
                </p>
            </div>
            <div className="relative mx-auto mt-8 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`${t('Search')} subjects...`} className="input-field pl-9" />
            </div>
            <div className="mx-auto mt-5 flex max-w-3xl flex-wrap justify-center gap-2">
                <button type="button" onClick={() => setTrack('')} className={`chip ${!trackSlug ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {t('All tracks')}
                </button>
                {tracks.map((track) => (
                    <button
                        key={track.id}
                        type="button"
                        onClick={() => setTrack(track.slug)}
                        className={`chip ${trackSlug === track.slug ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                    >
                        {locale === 'km' ? track.name_km : track.name_en}
                    </button>
                ))}
            </div>
            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState message={error} />
            ) : items.length === 0 ? (
                <EmptyState title={t('No results found')} />
            ) : (
                <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {items.map((subject) => (
                        <Link key={subject.id} to={`/subjects/${subject.id}`} className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
                            <div
                                className="grid h-24 place-items-center text-3xl font-bold text-white"
                                style={{ background: `linear-gradient(135deg, ${subject.color || '#1f6f5f'}, #0f766e)` }}
                            >
                                {pick(subject, 'name').charAt(0)}
                            </div>
                            <div className="p-5">
                                <h2 className="text-base font-semibold group-hover:text-brand-600">{pick(subject, 'name')}</h2>
                                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                    {pick(subject, 'description') || 'Lessons, exercises and mock exams.'}
                                </p>
                                <div className="mt-4 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span>{subject.chapters_count ?? '—'} chapters</span>
                                    <span className="truncate">{pick(subject.study_track, 'name') || 'Grade 12'}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export function SubjectDetail() {
    const { id } = useParams();
    const { pick, t } = useLocale();
    const [subject, setSubject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');
        api.get(`/subjects/${id}`)
            .then((response) => setSubject(unwrap(response)))
            .catch((loadError) => setError(getErrorMessage(loadError)))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return <div className="mx-auto max-w-5xl px-4 py-12"><LoadingState /></div>;
    }

    if (error || !subject) {
        return <div className="mx-auto max-w-5xl px-4 py-12"><ErrorState message={error || 'Subject not found.'} /></div>;
    }

    const chapters = subject.chapters || [];

    return (
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
            <Link to="/subjects" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600">
                <ArrowLeft className="size-4" /> {t('Subjects')}
            </Link>
            <div className="card mt-5 overflow-hidden">
                <div className="bg-gradient-to-r from-brand-700 to-teal-600 p-7 text-white">
                    <Badge tone="slate">{pick(subject.study_track, 'name') || 'Grade 12'}</Badge>
                    <h1 className="mt-3 text-3xl font-bold">{pick(subject, 'name')}</h1>
                    <p className="mt-2 max-w-2xl text-sm text-brand-50/90">{pick(subject, 'description')}</p>
                </div>
                <div className="p-6">
                    <h2 className="text-lg font-semibold">{t('Chapters')}</h2>
                    {chapters.length === 0 ? (
                        <div className="mt-4"><EmptyState title="No chapters published yet" /></div>
                    ) : (
                        <div className="mt-4 space-y-4">
                            {chapters.map((chapter) => (
                                <div key={chapter.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="font-semibold">{pick(chapter, 'title')}</h3>
                                        <Badge tone="slate">{chapter.lessons?.length || 0} lessons</Badge>
                                    </div>
                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                        {(chapter.lessons || []).map((lesson) => (
                                            <div key={lesson.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">
                                                <span className="truncate">{pick(lesson, 'title')}</span>
                                                <BookOpen className="size-4 shrink-0 text-brand-600" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function Materials() {
    const { pick, t, formatDate } = useLocale();
    const [search, setSearch] = useState('');
    const { items, loading, error } = usePublicList('/materials', { search, per_page: 30 });

    return (
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="text-center">
                <Badge tone="sky"><FileText className="size-3.5" /> {t('Materials')}</Badge>
                <h1 className="mt-4 text-3xl font-bold">Study materials</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Notes, formula sheets and revision guides shared by your school.</p>
            </div>
            <div className="relative mx-auto mt-8 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`${t('Search')} materials...`} className="input-field pl-9" />
            </div>
            <div className="mt-9">
                {loading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState message={error} />
                ) : items.length === 0 ? (
                    <EmptyState title={t('No results found')} />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((material) => (
                            <div key={material.id} className="card flex flex-col p-5">
                                <Badge tone={material.file_type === 'video' ? 'red' : 'sky'}>{material.file_type || 'pdf'}</Badge>
                                <h2 className="mt-3 font-semibold">{pick(material, 'title')}</h2>
                                <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500 dark:text-slate-400">{material.description}</p>
                                <p className="mt-3 text-xs text-slate-400">{formatDate(material.created_at)}</p>
                                {material.file_url && (
                                    <a href={material.file_url} target="_blank" rel="noreferrer" className="btn-secondary mt-4">
                                        <Download className="size-4" /> {t('Download')}
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export function Announcements() {
    const { pick, t, formatDate } = useLocale();
    const { items, loading, error } = usePublicList('/announcements', { per_page: 30 });

    return (
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="text-center">
                <Badge tone="gold"><Megaphone className="size-3.5" /> {t('Announcements')}</Badge>
                <h1 className="mt-4 text-3xl font-bold">News & announcements</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Important updates from your study hub.</p>
            </div>
            <div className="mt-9 space-y-4">
                {loading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState message={error} />
                ) : items.length === 0 ? (
                    <EmptyState title={t('No results found')} />
                ) : (
                    items.map((announcement) => (
                        <article key={announcement.id} className="card p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h2 className="text-lg font-semibold">{pick(announcement, 'title')}</h2>
                                <span className="text-xs text-slate-400">{formatDate(announcement.published_at || announcement.created_at)}</span>
                            </div>
                            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">{pick(announcement, 'body')}</p>
                        </article>
                    ))
                )}
            </div>
        </div>
    );
}
