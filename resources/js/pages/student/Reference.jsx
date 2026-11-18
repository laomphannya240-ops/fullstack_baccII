import { ArrowRight, BookOpen, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge, EmptyState, ErrorState, LoadingState, PageHeader, Pagination } from '../../components/ui';
import { useLocale } from '../../contexts/LocaleContext';
import { api, getErrorMessage, unwrap, unwrapMeta } from '../../lib/api';

export default function ReferencePage() {
    const { locale, pick, t } = useLocale();
    const [searchParams, setSearchParams] = useSearchParams();
    const [tracks, setTracks] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [references, setReferences] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const page = Number(searchParams.get('page') || 1);
    const trackSlug = searchParams.get('track_slug') || '';
    const subjectId = searchParams.get('subject_id') || '';
    const search = searchParams.get('search') || '';

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
        setLoading(true);
        setError('');

        const params = { is_reference: true, page, per_page: 12 };
        if (trackSlug) {
            params.track_slug = trackSlug;
        }
        if (subjectId) {
            params.subject_id = subjectId;
        }
        if (search) {
            params.search = search;
        }

        api.get('/lessons', { params })
            .then((response) => {
                setReferences(unwrap(response) || []);
                setMeta(unwrapMeta(response));
            })
            .catch((loadError) => setError(getErrorMessage(loadError)))
            .finally(() => setLoading(false));
    }, [page, trackSlug, subjectId, search]);

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

    function clearFilters() {
        setSearchParams(new URLSearchParams());
    }

    const visibleSubjects = trackSlug ? subjects.filter((subject) => subject.study_track?.slug === trackSlug) : subjects;

    return (
        <>
            <PageHeader
                title={t('Formula / Theory')}
                description="Quick formula sheets, definitions, dates and exam notes for every subject."
                actions={
                    (trackSlug || subjectId || search) && (
                        <button type="button" onClick={clearFilters} className="btn-secondary">
                            <X className="size-4" /> {t('Clear')}
                        </button>
                    )
                }
            />

            <div className="card mb-5 space-y-4 p-4">
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => updateFilter('track_slug', '')}
                        className={`chip ${!trackSlug ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                    >
                        {t('All tracks')}
                    </button>
                    {tracks.map((track) => (
                        <button
                            key={track.id}
                            type="button"
                            onClick={() => {
                                const next = new URLSearchParams(searchParams);
                                if (trackSlug === track.slug) {
                                    next.delete('track_slug');
                                } else {
                                    next.set('track_slug', track.slug);
                                    next.delete('subject_id');
                                }
                                next.delete('page');
                                setSearchParams(next);
                            }}
                            className={`chip ${trackSlug === track.slug ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                        >
                            {pick(track, 'name')}
                        </button>
                    ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="relative sm:col-span-2">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => updateFilter('search', event.target.value)}
                            placeholder={`${t('Search')} formulas, definitions, notes...`}
                            className="input-field pl-9"
                        />
                    </div>
                    <select value={subjectId} onChange={(event) => updateFilter('subject_id', event.target.value)} className="input-field">
                        <option value="">{t('All subjects')}</option>
                        {visibleSubjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>{pick(subject, 'name')}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState message={error} />
            ) : references.length === 0 ? (
                <EmptyState title={t('No results found')} description="Try another subject or clear your search." />
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {references.map((reference) => (
                            <Link key={reference.id} to={`/app/lessons/${reference.id}`} className="card group flex flex-col p-5 transition hover:-translate-y-1 hover:shadow-lg">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge tone="violet"><BookOpen className="size-3.5" /> {locale === 'km' ? 'យោង' : 'Reference'}</Badge>
                                    {reference.chapter?.subject && <Badge tone="slate">{pick(reference.chapter.subject, 'name')}</Badge>}
                                </div>
                                <h2 className="mt-3 text-base font-semibold group-hover:text-brand-600">{pick(reference, 'title')}</h2>
                                <p className="mt-2 flex-1 text-sm text-slate-500 dark:text-slate-400">{pick(reference, 'summary')}</p>
                                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                                    {t('View all')} <ArrowRight className="size-4" />
                                </p>
                            </Link>
                        ))}
                    </div>
                    <div className="mt-5">
                        <Pagination meta={meta} onPageChange={(next) => {
                            const params = new URLSearchParams(searchParams);
                            params.set('page', String(next));
                            setSearchParams(params);
                        }} />
                    </div>
                </>
            )}
        </>
    );
}
