import { Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { FormField } from './FormField';
import { Badge, EmptyState, ErrorState, LoadingState, Modal, PageHeader, Pagination } from './ui';
import { api, getErrorMessage, unwrap, unwrapMeta } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useLocale } from '../contexts/LocaleContext';

function getPath(source, path) {
    return path.split('.').reduce((current, key) => current?.[key], source);
}

function blankValue(field) {
    if (field.type === 'checkbox') {
        return false;
    }

    if (field.type === 'multi-select' || field.type === 'repeater' || field.type === 'lines') {
        return [];
    }

    return '';
}

function initialValues(fields, defaults = {}) {
    return fields.reduce((values, field) => {
        values[field.name] = defaults[field.name] ?? blankValue(field);

        return values;
    }, {});
}

function renderCell(row, column, pick) {
    if (column.render) {
        return column.render(row);
    }

    const value = getPath(row, column.key);

    if (column.localized) {
        return pick(value, column.field || 'name') || '—';
    }

    if (typeof value === 'boolean') {
        return <Badge tone={value ? 'green' : 'slate'}>{value ? 'Yes' : 'No'}</Badge>;
    }

    if (value === null || value === undefined || value === '') {
        return <span className="text-slate-400">—</span>;
    }

    return String(value);
}

export function CrudManager({
    title,
    description,
    endpoint,
    columns,
    fields,
    defaults = {},
    searchable = true,
    creatable = true,
    createLabel,
    filters = [],
    transformPayload,
    onSaved,
    modalSize = 'md',
    fixedParams = {},
    editable = true,
    deletable = true,
    rowActions,
}) {
    const toast = useToast();
    const { pick, t } = useLocale();
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filterValues, setFilterValues] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [values, setValues] = useState(initialValues(fields, defaults));
    const [fieldErrors, setFieldErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [options, setOptions] = useState({});
    const [reloadKey, setReloadKey] = useState(0);
    const fixedParamsKey = JSON.stringify(fixedParams);
    const showActions = editable || deletable || Boolean(rowActions);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const params = { page, per_page: 15, ...JSON.parse(fixedParamsKey) };

            if (search) {
                params.search = search;
            }

            Object.entries(filterValues).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    params[key] = value;
                }
            });

            const response = await api.get(endpoint, { params });
            setRows(unwrap(response) || []);
            setMeta(unwrapMeta(response));
        } catch (loadError) {
            setError(getErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, [endpoint, page, search, filterValues, reloadKey, fixedParamsKey]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        let cancelled = false;

        Promise.all(
            fields
                .filter((field) => ['select', 'multi-select'].includes(field.type) && typeof field.options === 'function')
                .map(async (field) => {
                    try {
                        const response = await field.options();
                        return [field.name, unwrap(response) || []];
                    } catch {
                        return [field.name, []];
                    }
                }),
        ).then((entries) => {
            if (!cancelled) {
                setOptions(Object.fromEntries(entries));
            }
        });

        return () => {
            cancelled = true;
        };
    }, [fields]);

    const openCreate = () => {
        setEditing(null);
        setValues(initialValues(fields, defaults));
        setFieldErrors({});
        setModalOpen(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setValues(
            fields.reduce((next, field) => {
                const extracted = field.fromRow ? field.fromRow(row) : getPath(row, field.source || field.name);
                next[field.name] = extracted ?? defaults[field.name] ?? blankValue(field);

                return next;
            }, {}),
        );
        setFieldErrors({});
        setModalOpen(true);
    };

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setFieldErrors({});

        try {
            const payload = transformPayload ? transformPayload(values, editing) : values;
            let response;

            if (payload instanceof FormData) {
                if (editing) {
                    payload.append('_method', 'PUT');
                }
                response = await api.post(editing ? `${endpoint}/${editing.id}` : endpoint, payload);
            } else if (editing) {
                response = await api.put(`${endpoint}/${editing.id}`, payload);
            } else {
                response = await api.post(endpoint, payload);
            }

            toast.success(response.data?.message || (editing ? 'Updated successfully.' : 'Created successfully.'));
            setModalOpen(false);
            onSaved?.();
            setReloadKey((key) => key + 1);
        } catch (submitError) {
            const errors = submitError?.response?.data?.errors;

            if (errors) {
                setFieldErrors(errors);
            }

            toast.error(getErrorMessage(submitError));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (row) => {
        if (!window.confirm(`Delete “${row.name || row.title_en || row.name_en || row.question_en || row.id}”?`)) {
            return;
        }

        try {
            const response = await api.delete(`${endpoint}/${row.id}`);
            toast.success(response.data?.message || 'Deleted successfully.');
            setReloadKey((key) => key + 1);
        } catch (deleteError) {
            toast.error(getErrorMessage(deleteError));
        }
    };

    return (
        <>
            <PageHeader
                title={title}
                description={description}
                actions={
                    <>
                        <button type="button" className="btn-secondary" onClick={() => setReloadKey((key) => key + 1)}>
                            <RefreshCw className="size-4" />
                            Refresh
                        </button>
                        {creatable && (
                            <button type="button" className="btn-primary" onClick={openCreate}>
                                <Plus className="size-4" />
                                {createLabel || `Add ${title.replace(/s$/, '')}`}
                            </button>
                        )}
                    </>
                }
            />

            <div className="card overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center dark:border-slate-800">
                    {searchable && (
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPage(1);
                                }}
                                placeholder={`${t('Search')}...`}
                                className="input-field pl-9"
                            />
                        </div>
                    )}
                    {filters.map((filter) => (
                        <select
                            key={filter.name}
                            value={filterValues[filter.name] || ''}
                            onChange={(event) => {
                                setFilterValues((current) => ({ ...current, [filter.name]: event.target.value }));
                                setPage(1);
                            }}
                            className="input-field sm:w-48"
                        >
                            <option value="">{filter.label}</option>
                            {(filter.options || []).map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    ))}
                </div>

                {loading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState message={error} onRetry={load} />
                ) : rows.length === 0 ? (
                    <EmptyState title={t('No results found')} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                                <tr>
                                    {columns.map((column) => (
                                        <th key={column.key} className="px-4 py-3 font-semibold">
                                            {column.label}
                                        </th>
                                    ))}
                                    {showActions && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                        {columns.map((column) => (
                                            <td key={column.key} className="px-4 py-3 align-top text-slate-700 dark:text-slate-200">
                                                {renderCell(row, column, pick)}
                                            </td>
                                        ))}
                                        {showActions && (
                                            <td className="px-4 py-3 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    {rowActions?.(row)}
                                                    {editable && (
                                                        <button type="button" onClick={() => openEdit(row)} className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-900/40" aria-label="Edit">
                                                            <Pencil className="size-4" />
                                                        </button>
                                                    )}
                                                    {deletable && !row.protected && (
                                                        <button type="button" onClick={() => remove(row)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" aria-label="Delete">
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="px-4">
                    <Pagination meta={meta} onPageChange={setPage} />
                </div>
            </div>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                size={modalSize}
                title={`${editing ? 'Edit' : 'Add'} ${title.replace(/s$/, '')}`}
                footer={
                    <>
                        <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                            {t('Cancel')}
                        </button>
                        <button type="submit" form="crud-form" className="btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : t('Save')}
                        </button>
                    </>
                }
            >
                <form id="crud-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    {fields.map((field) => {
                        const error = fieldErrors[field.name]?.[0];
                        const common = {
                            name: field.name,
                            label: field.label,
                            error,
                            required: field.required,
                            placeholder: field.placeholder,
                        };

                        if (field.type === 'multi-select') {
                            const selectOptions = typeof field.options === 'function' ? options[field.name] || [] : field.options || [];
                            const selected = (values[field.name] || []).map(String);

                            return (
                                <FormField key={field.name} {...common} hint={field.hint}>
                                    <select
                                        multiple
                                        name={field.name}
                                        value={selected}
                                        onChange={(event) =>
                                            setValues((current) => ({
                                                ...current,
                                                [field.name]: Array.from(event.target.selectedOptions, (option) => option.value),
                                            }))
                                        }
                                        className="input-field min-h-32"
                                    >
                                        {selectOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </FormField>
                            );
                        }

                        if (field.type === 'lines') {
                            const lines = values[field.name] || [];

                            return (
                                <div key={field.name} className="sm:col-span-2">
                                    <FormField {...common} hint={field.hint}>
                                        <div className="space-y-2">
                                            {lines.map((line, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <input
                                                        value={line}
                                                        onChange={(event) =>
                                                            setValues((current) => ({
                                                                ...current,
                                                                [field.name]: current[field.name].map((item, itemIndex) => (itemIndex === index ? event.target.value : item)),
                                                            }))
                                                        }
                                                        className="input-field"
                                                        placeholder={field.itemPlaceholder || 'Value'}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn-secondary px-3"
                                                        onClick={() =>
                                                            setValues((current) => ({
                                                                ...current,
                                                                [field.name]: current[field.name].filter((_, itemIndex) => itemIndex !== index),
                                                            }))
                                                        }
                                                        aria-label="Remove value"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                className="btn-secondary"
                                                onClick={() =>
                                                    setValues((current) => ({
                                                        ...current,
                                                        [field.name]: [...(current[field.name] || []), ''],
                                                    }))
                                                }
                                            >
                                                <Plus className="size-4" /> Add value
                                            </button>
                                        </div>
                                    </FormField>
                                </div>
                            );
                        }

                        if (field.type === 'repeater') {
                            const rows = values[field.name] || [];

                            return (
                                <div key={field.name} className="space-y-3 sm:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{field.label}</span>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() =>
                                                setValues((current) => ({
                                                    ...current,
                                                    [field.name]: [...(current[field.name] || []), { ...(field.itemDefaults || {}) }],
                                                }))
                                            }
                                        >
                                            <Plus className="size-4" /> Add row
                                        </button>
                                    </div>
                                    {rows.map((item, index) => (
                                        <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-2">
                                            {(field.itemFields || []).map((subfield) => (
                                                <label key={subfield.name} className="block">
                                                    <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">{subfield.label}</span>
                                                    {subfield.type === 'correct' ? (
                                                        <input
                                                            type="radio"
                                                            name={`correct-${field.name}`}
                                                            checked={Boolean(item.is_correct)}
                                                            onChange={() =>
                                                                setValues((current) => ({
                                                                    ...current,
                                                                    [field.name]: current[field.name].map((rowItem, rowIndex) => ({
                                                                        ...rowItem,
                                                                        is_correct: rowIndex === index,
                                                                    })),
                                                                }))
                                                            }
                                                            className="size-4 accent-brand-600"
                                                        />
                                                    ) : (
                                                        <input
                                                            type={subfield.type || 'text'}
                                                            value={item[subfield.name] ?? ''}
                                                            onChange={(event) =>
                                                                setValues((current) => ({
                                                                    ...current,
                                                                    [field.name]: current[field.name].map((rowItem, rowIndex) =>
                                                                        rowIndex === index ? { ...rowItem, [subfield.name]: event.target.value } : rowItem,
                                                                    ),
                                                                }))
                                                            }
                                                            className="input-field"
                                                        />
                                                    )}
                                                </label>
                                            ))}
                                            <button
                                                type="button"
                                                className="btn-secondary col-span-full justify-self-start"
                                                onClick={() =>
                                                    setValues((current) => ({
                                                        ...current,
                                                        [field.name]: current[field.name].filter((_, itemIndex) => itemIndex !== index),
                                                    }))
                                                }
                                            >
                                                <Trash2 className="size-4" /> Remove option
                                            </button>
                                        </div>
                                    ))}
                                    {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
                                </div>
                            );
                        }

                        if (field.type === 'textarea') {
                            return <div key={field.name} className="sm:col-span-2"><FormField {...common}><textarea name={field.name} rows={field.rows || 4} value={values[field.name] || ''} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="input-field" /></FormField></div>;
                        }

                        if (field.type === 'select') {
                            const selectOptions = typeof field.options === 'function' ? options[field.name] || [] : field.options || [];

                            return (
                                <FormField key={field.name} {...common}>
                                    <select
                                        name={field.name}
                                        value={values[field.name] ?? ''}
                                        onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                                        className="input-field"
                                    >
                                        <option value="">{field.placeholder || 'Select an option'}</option>
                                        {selectOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </FormField>
                            );
                        }

                        if (field.type === 'checkbox') {
                            return (
                                <label key={field.name} className="flex items-center gap-2.5 sm:col-span-2">
                                    <input
                                        type="checkbox"
                                        name={field.name}
                                        checked={Boolean(values[field.name])}
                                        onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.checked }))}
                                        className="size-4 rounded border-slate-300 text-brand-600"
                                    />
                                    <span className="text-sm font-medium">{field.label}</span>
                                </label>
                            );
                        }

                        if (field.type === 'file') {
                            return (
                                <FormField key={field.name} {...common}>
                                    <input
                                        type="file"
                                        name={field.name}
                                        accept={field.accept}
                                        onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.files?.[0] || null }))}
                                        className="input-field"
                                    />
                                </FormField>
                            );
                        }

                        return (
                            <FormField key={field.name} {...common}>
                                <input
                                    type={field.type || 'text'}
                                    name={field.name}
                                    value={values[field.name] ?? ''}
                                    min={field.min}
                                    max={field.max}
                                    step={field.step}
                                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                                    className="input-field"
                                />
                            </FormField>
                        );
                    })}
                </form>
            </Modal>
        </>
    );
}
