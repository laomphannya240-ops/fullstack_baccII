import { ArrowRight, CheckCircle2, LibraryBig, NotebookPen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, EmptyState, ErrorState, LoadingState, PageHeader } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import { useToast } from '../../contexts/ToastContext';
import { api, getErrorMessage, unwrap } from '../../lib/api';

function TrackPage({ trackSlug }) {
    const { locale, pick, t } = useLocale();
    const { user, refreshUser } = useAuth();
    const toast = useToast();
    const [track, setTrack] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selecting, setSelecting] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError('');

        Promise.all([
            api.get('/tracks'),
            api.get('/subjects', { params: { track_slug: trackSlug, per_page: 50 } }),
        ])
            .then(([trackResponse, subjectResponse]) => {
                const tracks = unwrap(trackResponse) || [];
                setTrack(tracks.find((item) => item.slug === trackSlug) || null);
                setSubjects(unwrap(subjectResponse) || []);
            })
            .catch((loadError) => setError(getErrorMessage(loadError)))
            .finally(() => setLoading(false));
    }, [trackSlug]);

    const isSelected = Boolean(track && user?.study_track?.id === track.id);
    const title = trackSlug === 'science' ? t('Science') : t('Social Science');
    const khmerTitle = trackSlug === 'science' ? 'វិទ្យាសាស្ត្រ' : 'វិទ្យាសាស្ត្រសង្គម';

    async function selectTrack() {
        if (!track) {
            return;
        }

        setSelecting(true);

        try {
            const response = await api.put('/select-track', { study_track_id: track.id });
            await refreshUser();
            toast.success(response.data?.message || `${title} selected.`);
        } catch (selectError) {
            toast.error(getErrorMessage(selectError));
        } finally {
            setSelecting(false);
        }
    }

    return (
        <>
            <PageHeader
                title={locale === 'km' ? khmerTitle : `${title} · ${khmerTitle}`}
                description={pick(track, 'description') || `Browse ${title.toLowerCase()} subjects, exercises and reference sheets.`}
                actions={
                    track && (
                        <button type="button" onClick={selectTrack} className={isSelected ? 'btn-secondary' : 'btn-primary'} disabled={selecting || isSelected}>
                            {isSelected ? <CheckCircle2 className="size-4" /> : <LibraryBig className="size-4" />}
                            {isSelected ? t('Selected') : `${t('Select')} ${title}`}
                        </button>
                    )
                }
            />

            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState message={error} />
            ) : subjects.length === 0 ? (
                <EmptyState title={t('No results found')} description="No subjects have been published for this track yet." />
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {subjects.map((subject, index) => (
                        <article key={subject.id} className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
                            <div
                                className="grid h-24 place-items-center text-3xl font-bold text-white"
                                style={{ background: `linear-gradient(135deg, ${subject.color || '#1f6f5f'}, #0f766e)` }}
                            >
                                {index + 1}
                            </div>
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-semibold group-hover:text-brand-600">{pick(subject, 'name')}</h2>
                                        {locale !== 'km' && <p className="text-xs text-slate-400">{subject.name_km}</p>}
                                    </div>
                                    <Badge tone="brand">{t('Subject')}</Badge>
                                </div>
                                <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{pick(subject, 'description')}</p>
                                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span>{subject.chapters_count ?? 0} {t('Chapters')}</span>
                                    <span>·</span>
                                    <span>{subject.exercises_count ?? 0} {t('Exercises')}</span>
                                </div>
                                <div className="mt-5 flex flex-wrap gap-2">
                                    <Link to={`/app/subjects/${subject.id}`} className="btn-primary flex-1">
                                        {t('View all')} <ArrowRight className="size-4" />
                                    </Link>
                                    <Link to={`/app/exercises?subject_id=${subject.id}`} className="btn-secondary" title="Practice exercises">
                                        <NotebookPen className="size-4" />
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </>
    );
}

export function SciencePage() {
    return <TrackPage trackSlug="science" />;
}

export function SocialSciencePage() {
    return <TrackPage trackSlug="social-science" />;
}
