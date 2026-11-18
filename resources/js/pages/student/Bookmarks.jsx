import { Bookmark, Download, ExternalLink, NotebookPen, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, ErrorState, LoadingState, PageHeader, Pagination } from '../../components/ui';
import { useLocale } from '../../contexts/LocaleContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { api, getErrorMessage, unwrap, unwrapMeta } from '../../lib/api';

export default function BookmarksPage() {
    usePageTitle('Bookmarks');
    const { pick, t, formatDate } = useLocale();
    const toast = useToast();
    const [bookmarks, setBookmarks] = useState([]);
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');
        api.get('/bookmarks', { params: { page, per_page: 12 } })
            .then((response) => {
                setBookmarks(unwrap(response) || []);
                setMeta(unwrapMeta(response));
            })
            .catch((loadError) => setError(getErrorMessage(loadError)))
            .finally(() => setLoading(false));
    }, [page]);

    async function remove(bookmark) {
        try {
            const response = await api.delete(`/bookmarks/${bookmark.id}`);
            toast.success(response.data?.message || 'Bookmark removed.');
            setBookmarks((current) => current.filter((item) => item.id !== bookmark.id));
        } catch (removeError) {
            toast.error(getErrorMessage(removeError));
        }
    }

    return (
        <>
            <PageHeader title={t('Bookmarks')} description="Lessons, exercises and materials you saved for later." />
            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState message={error} />
            ) : bookmarks.length === 0 ? (
                <div className="card flex min-h-64 flex-col items-center justify-center gap-2 text-center">
                    <Bookmark className="size-9 text-slate-400" />
                    <h2 className="font-semibold">No bookmarks yet</h2>
                    <p className="max-w-sm text-sm text-slate-500">Use the bookmark button on lessons, exercises and materials to save them here.</p>
                </div>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {bookmarks.map((bookmark) => {
                            const item = bookmark.item || {};
                            const type = bookmark.type?.split('\\').pop()?.toLowerCase() || '';

                            return (
                                <article key={bookmark.id} className="card flex flex-col p-5">
                                    <div className="flex items-center justify-between gap-2">
                                        <Badge tone="brand">{type}</Badge>
                                        <button type="button" onClick={() => remove(bookmark)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove bookmark">
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                    <h2 className="mt-3 flex-1 font-semibold">{pick(item, 'title') || pick(item, 'question') || 'Saved item'}</h2>
                                    <p className="mt-1 text-xs text-slate-500">Saved {formatDate(bookmark.created_at)}</p>
                                    <div className="mt-4">
                                        {type === 'lesson' && (
                                            <Link to={`/app/lessons/${item.id}`} className="btn-secondary w-full">
                                                <NotebookPen className="size-4" /> Open lesson
                                            </Link>
                                        )}
                                        {type === 'exercise' && (
                                            <Link to="/app/exercises" className="btn-secondary w-full">
                                                <ExternalLink className="size-4" /> Practise exercises
                                            </Link>
                                        )}
                                        {type === 'material' && item.file_url && (
                                            <a href={item.file_url} target="_blank" rel="noreferrer" className="btn-secondary w-full">
                                                <Download className="size-4" /> Download
                                            </a>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                    <div className="mt-5"><Pagination meta={meta} onPageChange={setPage} /></div>
                </>
            )}
        </>
    );
}
