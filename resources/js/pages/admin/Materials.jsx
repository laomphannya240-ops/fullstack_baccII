import {
    Eye,
    FileText,
    Pencil,
    Plus,
    Search,
    Trash2,
    UploadCloud,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import MaterialViewer, { formatFileSize, normalizeMaterialFiles } from '../../components/MaterialViewer';
import { Badge, EmptyState, ErrorState, LoadingState, Modal, PageHeader, Pagination } from '../../components/ui';
import { useLocale } from '../../contexts/LocaleContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { api, getErrorMessage, unwrap, unwrapMeta } from '../../lib/api';

const EMPTY_FORM = {
    subject_id: '',
    chapter_id: '',
    title_en: '',
    title_km: '',
    description: '',
    is_published: true,
};

function isPdfFile(file) {
    return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

function isValidMaterialFile(file) {
    return isPdfFile(file) || /\.(jpe?g|png|webp)$/i.test(file.name);
}

export default function AdminMaterials() {
    usePageTitle('Materials');
    const { pick, t } = useLocale();
    const toast = useToast();

    const [tracks, setTracks] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [filterChapters, setFilterChapters] = useState([]);
    const [formChapters, setFormChapters] = useState([]);

    const [search, setSearch] = useState('');
    const [trackId, setTrackId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [chapterId, setChapterId] = useState('');
    const [page, setPage] = useState(1);
    const [materials, setMaterials] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formTrackId, setFormTrackId] = useState('');
    const [form, setForm] = useState(EMPTY_FORM);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [removedIds, setRemovedIds] = useState([]);
    const [replaceFiles, setReplaceFiles] = useState(false);
    const [fileInputKey, setFileInputKey] = useState(0);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const [previewMaterial, setPreviewMaterial] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    const loadMaterials = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await api.get('/admin/materials', {
                params: {
                    page,
                    per_page: 15,
                    search: search || undefined,
                    track_id: trackId || undefined,
                    subject_id: subjectId || undefined,
                    chapter_id: chapterId || undefined,
                },
            });

            setMaterials(unwrap(response) || []);
            setMeta(unwrapMeta(response));
        } catch (loadError) {
            setError(getErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, [chapterId, page, search, subjectId, trackId]);

    useEffect(() => {
        const timer = window.setTimeout(loadMaterials, 250);

        return () => window.clearTimeout(timer);
    }, [loadMaterials]);

    useEffect(() => {
        Promise.all([
            api.get('/admin/tracks', { params: { per_page: 100 } }),
            api.get('/admin/subjects', { params: { per_page: 100 } }),
        ])
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
        setChapterId('');

        if (!subjectId) {
            setFilterChapters([]);
            return undefined;
        }

        let active = true;

        api.get('/admin/chapters', { params: { subject_id: subjectId, per_page: 100 } })
            .then((response) => {
                if (active) {
                    setFilterChapters(unwrap(response) || []);
                }
            })
            .catch(() => {
                if (active) {
                    setFilterChapters([]);
                }
            });

        return () => {
            active = false;
        };
    }, [subjectId]);

    useEffect(() => {
        if (!form.subject_id) {
            setFormChapters([]);
            return undefined;
        }

        let active = true;

        api.get('/admin/chapters', { params: { subject_id: form.subject_id, per_page: 100 } })
            .then((response) => {
                if (active) {
                    setFormChapters(unwrap(response) || []);
                }
            })
            .catch(() => {
                if (active) {
                    setFormChapters([]);
                }
            });

        return () => {
            active = false;
        };
    }, [form.subject_id]);

    const filterSubjects = useMemo(
        () => subjects.filter((subject) => !trackId || String(subject.study_track?.id) === String(trackId)),
        [subjects, trackId],
    );
    const formSubjects = useMemo(
        () => subjects.filter((subject) => !formTrackId || String(subject.study_track?.id) === String(formTrackId)),
        [formTrackId, subjects],
    );
    const managedFiles = editing?.files || [];
    const existingFiles = editing ? normalizeMaterialFiles(editing) : [];
    const hasFilters = Boolean(search || trackId || subjectId || chapterId);

    const resetModalState = () => {
        setSelectedFiles([]);
        setRemovedIds([]);
        setReplaceFiles(false);
        setFileInputKey((value) => value + 1);
        setFormError('');
    };

    const openCreate = () => {
        setEditing(null);
        setFormTrackId('');
        setForm(EMPTY_FORM);
        resetModalState();
        setModalOpen(true);
    };

    const openEdit = (material) => {
        setEditing(material);
        setFormTrackId(String(material.subject?.study_track?.id || material.subject?.study_track_id || ''));
        setForm({
            subject_id: String(material.subject?.id || ''),
            chapter_id: String(material.chapter?.id || ''),
            title_en: material.title_en || '',
            title_km: material.title_km || '',
            description: material.description || '',
            is_published: Boolean(material.is_published),
        });
        resetModalState();
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
    };

    const openPreview = (material) => {
        setPreviewMaterial(material);
        setPreviewOpen(true);
    };

    const validateSelection = () => {
        const pdfCount = selectedFiles.filter(isPdfFile).length;
        const imageCount = selectedFiles.length - pdfCount;

        if ((!editing || replaceFiles) && selectedFiles.length === 0) {
            return t('Choose at least one file.');
        }

        if (selectedFiles.length > 20) {
            return t('No more than 20 files.');
        }

        if (selectedFiles.some((file) => !isValidMaterialFile(file))) {
            return t('Only PDF and image files are supported.');
        }

        if (pdfCount > 0 && imageCount > 0) {
            return t('Do not mix PDF and image files.');
        }

        if (pdfCount > 1) {
            return t('Upload only one PDF per material.');
        }

        if (editing && !replaceFiles && managedFiles.length > 0 && removedIds.length >= managedFiles.length && selectedFiles.length === 0) {
            return t('Keep at least one file in the material.');
        }

        return '';
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const validationMessage = validateSelection();

        if (validationMessage) {
            setFormError(validationMessage);
            return;
        }

        setSaving(true);
        setFormError('');

        try {
            const payload = new FormData();

            if (editing) {
                payload.append('_method', 'PUT');
            }

            payload.append('subject_id', String(form.subject_id));
            payload.append('chapter_id', String(form.chapter_id));
            payload.append('title_en', form.title_en);
            payload.append('title_km', form.title_km);
            payload.append('description', form.description || '');
            payload.append('is_published', form.is_published ? '1' : '0');

            if (editing) {
                if (replaceFiles) {
                    payload.append('replace_files', '1');
                } else {
                    removedIds.forEach((id) => payload.append('removed_file_ids[]', String(id)));
                }
            }

            selectedFiles.forEach((file) => payload.append('files[]', file));

            const response = await api.post(
                editing ? `/admin/materials/${editing.id}` : '/admin/materials',
                payload,
            );

            toast.success(response.data?.message || t(editing ? 'Material updated.' : 'Material uploaded.'));
            closeModal();
            await loadMaterials();
        } catch (submitError) {
            const message = getErrorMessage(submitError);
            setFormError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (material) => {
        if (!window.confirm(`${t('Delete this material?')}\n${t('This cannot be undone.')}`)) {
            return;
        }

        try {
            const response = await api.delete(`/admin/materials/${material.id}`);
            toast.success(response.data?.message || t('Material deleted.'));

            if (previewMaterial?.id === material.id) {
                setPreviewOpen(false);
                setPreviewMaterial(null);
            }

            await loadMaterials();
        } catch (deleteError) {
            toast.error(getErrorMessage(deleteError));
        }
    };

    const clearFilters = () => {
        setSearch('');
        setTrackId('');
        setSubjectId('');
        setChapterId('');
        setPage(1);
    };

    const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    return (
        <>
            <PageHeader
                title={t('Study materials')}
                description={t('Upload revision notes, formula sheets and guides for students to read and download.')}
                actions={
                    <button type="button" onClick={openCreate} className="btn-primary">
                        <Plus className="size-4" /> {t('New material')}
                    </button>
                }
            />

            <div className="card mb-5 p-4 sm:p-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <label className="block xl:col-span-2">
                        <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{t('Search')}</span>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPage(1);
                                }}
                                placeholder={`${t('Search')} ${t('Materials').toLowerCase()}...`}
                                className="input-field pl-9"
                            />
                        </div>
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{t('Track')}</span>
                        <select
                            value={trackId}
                            onChange={(event) => {
                                setTrackId(event.target.value);
                                setSubjectId('');
                                setPage(1);
                            }}
                            className="input-field"
                        >
                            <option value="">{t('All tracks')}</option>
                            {tracks.map((track) => (
                                <option key={track.id} value={track.id}>{pick(track, 'name')}</option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{t('Subject')}</span>
                        <select
                            value={subjectId}
                            onChange={(event) => {
                                setSubjectId(event.target.value);
                                setPage(1);
                            }}
                            className="input-field"
                        >
                            <option value="">{t('All subjects')}</option>
                            {filterSubjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>{pick(subject, 'name')}</option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{t('Chapter')}</span>
                        <select
                            value={chapterId}
                            onChange={(event) => {
                                setChapterId(event.target.value);
                                setPage(1);
                            }}
                            className="input-field"
                            disabled={!subjectId}
                        >
                            <option value="">{t('All chapters')}</option>
                            {filterChapters.map((chapter) => (
                                <option key={chapter.id} value={chapter.id}>{pick(chapter, 'title')}</option>
                            ))}
                        </select>
                    </label>
                    {hasFilters && (
                        <button type="button" onClick={clearFilters} className="btn-secondary self-end justify-center">
                            <X className="size-4" /> {t('Clear filters')}
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState message={error} onRetry={loadMaterials} />
            ) : materials.length === 0 ? (
                <EmptyState
                    title={t('No materials yet')}
                    description={hasFilters ? t('Clear filters') : t('Upload your first material to get started.')}
                    action={<button type="button" onClick={openCreate} className="btn-primary"><Plus className="size-4" /> {t('New material')}</button>}
                />
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">{t('Title')}</th>
                                    <th className="px-5 py-3 font-semibold">{t('Subject')}</th>
                                    <th className="px-5 py-3 font-semibold">{t('Type')}</th>
                                    <th className="px-5 py-3 font-semibold">{t('Files')}</th>
                                    <th className="px-5 py-3 font-semibold">{t('Status')}</th>
                                    <th className="px-5 py-3 text-right font-semibold">{t('Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {materials.map((material) => {
                                    const files = normalizeMaterialFiles(material);
                                    const type = material.material_type || material.file_type || 'pdf';

                                    return (
                                        <tr key={material.id}>
                                            <td className="px-5 py-4">
                                                <p className="font-semibold">{pick(material, 'title')}</p>
                                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{pick(material.chapter, 'title') || '—'}</p>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                                <p>{pick(material.subject, 'name') || '—'}</p>
                                                <p className="text-xs text-slate-400">{pick(material.subject?.study_track, 'name')}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <Badge tone={type === 'image' ? 'violet' : 'sky'}>{type === 'image' ? t('Image') : type.toUpperCase()}</Badge>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                                {files.length} {files.length === 1 ? t('file') : t('files')}
                                            </td>
                                            <td className="px-5 py-4">
                                                <Badge tone={material.is_published ? 'green' : 'amber'}>
                                                    {material.is_published ? t('Published') : t('Draft')}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-1">
                                                    <button type="button" onClick={() => openPreview(material)} className="btn-secondary px-2.5 py-2" title={t('Preview')}>
                                                        <Eye className="size-4" />
                                                    </button>
                                                    <button type="button" onClick={() => openEdit(material)} className="btn-secondary px-2.5 py-2" title={t('Edit')}>
                                                        <Pencil className="size-4" />
                                                    </button>
                                                    <button type="button" onClick={() => handleDelete(material)} className="btn-secondary px-2.5 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40" title={t('Delete')}>
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <Pagination meta={meta} onPageChange={setPage} />
                </div>
            )}

            <Modal
                open={modalOpen}
                onClose={closeModal}
                title={editing ? t('Edit material') : t('New material')}
                size="xl"
                footer={
                    <>
                        <button type="button" onClick={closeModal} className="btn-secondary" disabled={saving}>
                            {t('Cancel')}
                        </button>
                        <button type="submit" form="admin-material-form" className="btn-primary" disabled={saving}>
                            {saving ? t('Loading') : t('Save')}
                        </button>
                    </>
                }
            >
                <form id="admin-material-form" onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium">{t('Track')}</span>
                            <select
                                value={formTrackId}
                                onChange={(event) => {
                                    setFormTrackId(event.target.value);
                                    updateForm('subject_id', '');
                                    updateForm('chapter_id', '');
                                }}
                                className="input-field"
                            >
                                <option value="">{t('All tracks')}</option>
                                {tracks.map((track) => (
                                    <option key={track.id} value={track.id}>{pick(track, 'name')}</option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium">{t('Subject')} *</span>
                            <select
                                value={form.subject_id}
                                onChange={(event) => {
                                    updateForm('subject_id', event.target.value);
                                    updateForm('chapter_id', '');
                                }}
                                className="input-field"
                                required
                            >
                                <option value="">{t('Select')}</option>
                                {formSubjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>{pick(subject, 'name')}</option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium">{t('Chapter')} *</span>
                            <select
                                value={form.chapter_id}
                                onChange={(event) => updateForm('chapter_id', event.target.value)}
                                className="input-field"
                                required
                                disabled={!form.subject_id}
                            >
                                <option value="">{t('Select')}</option>
                                {formChapters.map((chapter) => (
                                    <option key={chapter.id} value={chapter.id}>{pick(chapter, 'title')}</option>
                                ))}
                            </select>
                        </label>
                        <label className="flex items-center gap-2 self-end rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-800">
                            <input
                                type="checkbox"
                                checked={form.is_published}
                                onChange={(event) => updateForm('is_published', event.target.checked)}
                                className="size-4 accent-brand-600"
                            />
                            {t('Published')}
                        </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium">{t('Title (English)')} *</span>
                            <input value={form.title_en} onChange={(event) => updateForm('title_en', event.target.value)} className="input-field" maxLength={200} required />
                        </label>
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium">{t('Title (Khmer)')} *</span>
                            <input value={form.title_km} onChange={(event) => updateForm('title_km', event.target.value)} className="input-field" maxLength={200} required />
                        </label>
                    </div>

                    <label className="block">
                        <span className="mb-1.5 block text-sm font-medium">{t('Description')}</span>
                        <textarea value={form.description} onChange={(event) => updateForm('description', event.target.value)} rows={3} className="input-field" />
                    </label>

                    {editing && existingFiles.length > 0 && (
                        <div>
                            <p className="mb-2 text-sm font-medium">{t('Current files')}</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {existingFiles.map((file) => (
                                    <div key={file.id ?? file.url} className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 dark:border-slate-800">
                                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800">
                                            {file.type === 'image' ? <Eye className="size-4" /> : <FileText className="size-4" />}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold">{file.name}</p>
                                            <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                                        </div>
                                        {file.id && !replaceFiles && (
                                            <label className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                                                <input
                                                    type="checkbox"
                                                    checked={removedIds.includes(file.id)}
                                                    onChange={(event) => {
                                                        setRemovedIds((current) => event.target.checked
                                                            ? [...current, file.id]
                                                            : current.filter((id) => id !== file.id));
                                                    }}
                                                    className="size-4 accent-red-600"
                                                />
                                                {t('Remove selected')}
                                            </label>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <label className="mt-3 flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={replaceFiles}
                                    onChange={(event) => {
                                        setReplaceFiles(event.target.checked);
                                        setRemovedIds([]);
                                    }}
                                    className="size-4 accent-brand-600"
                                />
                                {t('Replace all files')}
                            </label>
                        </div>
                    )}

                    <div>
                        <span className="mb-1.5 block text-sm font-medium">
                            {t('Files (PDF or images)')}{!editing && ' *'}
                        </span>
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                            <div className="flex items-center gap-3">
                                <UploadCloud className="size-6 shrink-0 text-brand-600 dark:text-brand-300" />
                                <div className="min-w-0 flex-1">
                                    <input
                                        key={fileInputKey}
                                        type="file"
                                        multiple
                                        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                                        onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
                                        className="input-field bg-white dark:bg-slate-900"
                                    />
                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('Accepted: PDF, JPG, JPEG, PNG, WEBP up to 20 MB each.')}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('A material can contain one PDF or multiple images, not both.')}</p>
                                </div>
                            </div>

                            {selectedFiles.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {selectedFiles.map((file, index) => (
                                        <span key={`${file.name}-${index}`} className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
                                            <FileText className="size-3.5" />
                                            <span className="max-w-40 truncate">{file.name}</span>
                                            <span className="text-brand-500">{formatFileSize(file.size)}</span>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                                                className="rounded-full p-0.5 hover:bg-brand-100 dark:hover:bg-brand-800"
                                                aria-label={t('Delete')}
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {formError && (
                        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                            {formError}
                        </p>
                    )}
                </form>
            </Modal>

            <MaterialViewer
                material={previewMaterial}
                open={previewOpen}
                onClose={() => {
                    setPreviewOpen(false);
                    setPreviewMaterial(null);
                }}
            />
        </>
    );
}
