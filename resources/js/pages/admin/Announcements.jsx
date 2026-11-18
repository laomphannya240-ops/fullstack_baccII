import { CrudManager } from '../../components/CrudManager';
import { PageHeader } from '../../components/ui';
import { usePageTitle } from '../../hooks/usePageTitle';

const fields = [
    { name: 'title_en', label: 'Title (English)', required: true },
    { name: 'title_km', label: 'Title (Khmer)', required: true },
    { name: 'body_en', label: 'Body (English)', type: 'textarea', rows: 5, required: true },
    { name: 'body_km', label: 'Body (Khmer)', type: 'textarea', rows: 5, required: true },
    { name: 'published_at', label: 'Published at', type: 'datetime-local', fromRow: (row) => (row.published_at ? row.published_at.slice(0, 16) : '') },
    { name: 'is_pinned', label: 'Pin to top', type: 'checkbox' },
];

export default function AdminAnnouncements() {
    usePageTitle('Announcements');

    return (
        <>
            <PageHeader title="Announcements" description="Share updates with students across both study tracks." />
            <CrudManager
                title="Announcements"
                endpoint="/admin/announcements"
                fields={fields}
                columns={[
                    { key: 'title_en', label: 'Title (English)' },
                    { key: 'title_km', label: 'Title (Khmer)' },
                    { key: 'published_at', label: 'Published', render: (row) => (row.published_at ? new Date(row.published_at).toLocaleString() : '—') },
                    { key: 'is_pinned', label: 'Pinned' },
                ]}
                modalSize="lg"
            />
        </>
    );
}
