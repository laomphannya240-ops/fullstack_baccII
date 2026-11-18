import { CrudManager } from '../../components/CrudManager';
import { PageHeader } from '../../components/ui';
import { usePageTitle } from '../../hooks/usePageTitle';

const fields = [
    { name: 'slug', label: 'Slug', required: true },
    { name: 'name_en', label: 'Name (English)', required: true },
    { name: 'name_km', label: 'Name (Khmer)', required: true },
    { name: 'description_en', label: 'Description (English)', type: 'textarea' },
    { name: 'description_km', label: 'Description (Khmer)', type: 'textarea' },
    { name: 'icon', label: 'Icon name' },
    { name: 'sort_order', label: 'Sort order', type: 'number', min: 0 },
    { name: 'is_active', label: 'Active', type: 'checkbox' },
];

export default function AdminTracks() {
    usePageTitle('Study Tracks');

    return (
        <>
            <PageHeader title="Study tracks" description="Science and Social Science tracks shown during registration." />
            <CrudManager
                title="Tracks"
                endpoint="/admin/tracks"
                fields={fields}
                columns={[
                    { key: 'name_en', label: 'Name (English)' },
                    { key: 'name_km', label: 'Name (Khmer)' },
                    { key: 'slug', label: 'Slug' },
                    { key: 'subjects_count', label: 'Subjects' },
                    { key: 'is_active', label: 'Active' },
                ]}
            />
        </>
    );
}
