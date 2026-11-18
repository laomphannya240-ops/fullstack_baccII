import {
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    FileText,
    Image as ImageIcon,
    Maximize2,
    Minimize2,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '../contexts/LocaleContext';
import { Badge } from './ui';

export function normalizeMaterialFiles(material) {
    if (!material) {
        return [];
    }

    if (Array.isArray(material.files) && material.files.length > 0) {
        return material.files;
    }

    if (!material.file_url) {
        return [];
    }

    return [{
        id: material.id,
        name: material.file_name || material.file_url.split('/').pop() || 'material',
        type: material.material_type || material.file_type || 'pdf',
        url: material.file_url,
        size: material.file_size,
        sort_order: 0,
    }];
}

export function formatFileSize(size) {
    if (!size || Number(size) <= 0) {
        return '';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    let value = Number(size);
    let unit = 0;

    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }

    return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

export function MaterialCard({ material, onOpen }) {
    const { pick, t, formatDate } = useLocale();
    const files = normalizeMaterialFiles(material);
    const type = material.material_type || material.file_type || 'pdf';
    const typeLabel = type === 'pdf' ? 'PDF' : type === 'image' ? t('Image') : type.toUpperCase();
    const totalSize = files.reduce((sum, file) => sum + Number(file.size || 0), 0);

    return (
        <article className="card flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone={type === 'image' ? 'violet' : 'sky'}>{typeLabel}</Badge>
                <span className="text-xs text-slate-400">
                    {files.length} {files.length === 1 ? t('file') : t('files')}
                    {formatFileSize(totalSize) && ` · ${formatFileSize(totalSize)}`}
                </span>
            </div>
            <h3 className="mt-3 font-semibold leading-snug">{pick(material, 'title')}</h3>
            {material.description && (
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500 dark:text-slate-400">{material.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                {material.subject && <span>{pick(material.subject, 'name')}</span>}
                {material.chapter && <span>· {pick(material.chapter, 'title')}</span>}
            </div>
            <p className="mt-2 text-xs text-slate-400">{formatDate(material.created_at)}</p>
            <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => onOpen(material)} className="btn-primary flex-1 justify-center">
                    <Eye className="size-4" /> {t('Open material')}
                </button>
                {files[0]?.url && (
                    <a href={files[0].url} download className="btn-secondary px-3" title={t('Download')}>
                        <Download className="size-4" />
                    </a>
                )}
            </div>
        </article>
    );
}

export default function MaterialViewer({ material, open, onClose }) {
    const { t } = useLocale();
    const files = useMemo(() => normalizeMaterialFiles(material), [material]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [zoom, setZoom] = useState(100);
    const [page, setPage] = useState(1);
    const [pageCount, setPageCount] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef(null);

    const activeFile = files[activeIndex];
    const isPdf = activeFile?.type === 'pdf';
    const isImage = activeFile?.type === 'image';
    const canDownload = Boolean(activeFile?.url);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        setActiveIndex(0);
        setZoom(100);
        setPage(1);
        setPageCount(null);

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                if (document.fullscreenElement) {
                    document.exitFullscreen?.();
                } else {
                    onClose();
                }
            }

            if (activeFile?.type === 'image') {
                if (event.key === 'ArrowRight') {
                    setActiveIndex((current) => Math.min(files.length - 1, current + 1));
                }

                if (event.key === 'ArrowLeft') {
                    setActiveIndex((current) => Math.max(0, current - 1));
                }
            }
        };

        const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));

        window.addEventListener('keydown', onKeyDown);
        document.addEventListener('fullscreenchange', onFullscreenChange);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('fullscreenchange', onFullscreenChange);
        };
    }, [open, onClose, files.length, activeFile?.type]);

    useEffect(() => {
        if (!open || !isPdf || !activeFile?.url) {
            return undefined;
        }

        let cancelled = false;
        setPageCount(null);

        fetch(activeFile.url)
            .then((response) => response.arrayBuffer())
            .then((buffer) => {
                if (cancelled) {
                    return;
                }

                const text = new TextDecoder('iso-8859-1').decode(buffer.slice(0, 6 * 1024 * 1024));
                const matches = text.match(/\/Type\s*\/Page\b/g);
                setPageCount(matches && matches.length > 0 ? matches.length : null);
            })
            .catch(() => {
                if (!cancelled) {
                    setPageCount(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [open, isPdf, activeFile?.url]);

    if (!open || !material) {
        return null;
    }

    const changeZoom = (delta) => setZoom((current) => Math.min(250, Math.max(50, current + delta)));

    const toggleFullscreen = async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await containerRef.current?.requestFullscreen?.();
            }
        } catch {
            // Fullscreen is optional; keep the viewer usable without it.
        }
    };

    const pdfSource = activeFile
        ? `${activeFile.url}#page=${page}&zoom=${zoom}&toolbar=0&navpanes=0`
        : '';

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={material.title_en || t('Materials')}>
            <div ref={containerRef} className="flex h-full min-h-0 flex-col bg-white dark:bg-slate-950">
                <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                            {isImage ? <ImageIcon className="size-4.5" /> : <FileText className="size-4.5" />}
                        </span>
                        <div className="min-w-0">
                            <h2 className="truncate text-sm font-semibold sm:text-base">{material.title_en || material.title_km || t('Materials')}</h2>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {activeFile?.name || t('No file available')}
                                {files.length > 1 && ` · ${activeIndex + 1}/${files.length}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        {canDownload && (
                            <a href={activeFile.url} download className="btn-secondary px-2.5 py-2" title={t('Download')}>
                                <Download className="size-4" />
                                <span className="hidden sm:inline">{t('Download')}</span>
                            </a>
                        )}
                        <button type="button" onClick={toggleFullscreen} className="btn-secondary px-2.5 py-2" title={t('Fullscreen')}>
                            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                        </button>
                        <button type="button" onClick={onClose} className="btn-secondary px-2.5 py-2" title={t('Close')}>
                            <X className="size-4" />
                        </button>
                    </div>
                </header>

                {files.length > 1 && (
                    <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-slate-200 px-4 py-2 dark:border-slate-800">
                        {files.map((file, index) => (
                            <button
                                key={file.id ?? `${file.url}-${index}`}
                                type="button"
                                onClick={() => {
                                    setActiveIndex(index);
                                    setPage(1);
                                    setZoom(100);
                                }}
                                className={`chip shrink-0 ${index === activeIndex ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                            >
                                {file.type === 'pdf' ? <FileText className="size-3.5" /> : <ImageIcon className="size-3.5" />}
                                {file.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex min-h-0 flex-1 items-stretch justify-center overflow-auto bg-slate-100 p-2 dark:bg-slate-900 sm:p-4">
                    {isPdf && (
                        <iframe
                            key={pdfSource}
                            src={pdfSource}
                            title={activeFile.name}
                            className="h-full min-h-[60vh] w-full rounded-lg border-0 bg-white shadow-sm"
                        />
                    )}

                    {isImage && (
                        <div className="flex h-full w-full flex-col items-center justify-start gap-3 overflow-auto">
                            <img
                                src={activeFile.url}
                                alt={activeFile.name}
                                style={{ width: `${zoom}%` }}
                                className="h-auto max-w-none rounded-lg bg-white shadow-sm dark:bg-slate-800"
                            />
                        </div>
                    )}

                    {!isPdf && !isImage && (
                        <div className="m-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                            <FileText className="mx-auto size-10 text-brand-600" />
                            <p className="mt-3 text-sm font-semibold">{t('Preview is not available for this file type')}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{activeFile?.name}</p>
                            {canDownload && <a href={activeFile.url} download className="btn-primary mt-5"><Download className="size-4" /> {t('Download')}</a>}
                        </div>
                    )}

                    {!activeFile && (
                        <div className="m-auto text-sm text-slate-500">{t('No file available')}</div>
                    )}
                </div>

                <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2.5 dark:border-slate-800">
                    <div className="flex items-center gap-1">
                        {isPdf && (
                            <>
                                <button type="button" className="btn-secondary px-2.5 py-2" onClick={() => setPage((current) => Math.max(1, current - 1))} aria-label={t('Previous page')}>
                                    <ChevronLeft className="size-4" />
                                </button>
                                <span className="min-w-24 text-center text-xs text-slate-600 dark:text-slate-300">
                                    {t('Page')} {page}{pageCount ? ` / ${pageCount}` : ''}
                                </span>
                                <button type="button" className="btn-secondary px-2.5 py-2" onClick={() => setPage((current) => Math.min(pageCount || 999, current + 1))} aria-label={t('Next page')}>
                                    <ChevronRight className="size-4" />
                                </button>
                            </>
                        )}

                        {isImage && files.length > 1 && (
                            <>
                                <button type="button" className="btn-secondary px-2.5 py-2" onClick={() => setActiveIndex((current) => Math.max(0, current - 1))} aria-label={t('Previous image')}>
                                    <ChevronLeft className="size-4" />
                                </button>
                                <button type="button" className="btn-secondary px-2.5 py-2" onClick={() => setActiveIndex((current) => Math.min(files.length - 1, current + 1))} aria-label={t('Next image')}>
                                    <ChevronRight className="size-4" />
                                </button>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <button type="button" className="btn-secondary px-2.5 py-2" onClick={() => changeZoom(-25)} aria-label={t('Zoom out')}>
                            <ZoomOut className="size-4" />
                        </button>
                        <span className="min-w-12 text-center text-xs font-medium text-slate-600 dark:text-slate-300">{zoom}%</span>
                        <button type="button" className="btn-secondary px-2.5 py-2" onClick={() => changeZoom(25)} aria-label={t('Zoom in')}>
                            <ZoomIn className="size-4" />
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}
