import { useEffect, useState } from 'react';
import { CrudManager } from '../../components/CrudManager';
import { PageHeader } from '../../components/ui';
import { usePageTitle } from '../../hooks/usePageTitle';
import { loadSubjects } from './config';

export default function AdminChapters() {
    usePageTitle('Chapters');
    const [subjectFilters, setSubjectFilters] = useState([]);

    useEffect(() => {
        loadSubjects()
            .then(setSubjectFilters)
            .catch(() => setSubjectFilters([]));
    }, []);

    return (
        <>
            <PageHeader title="Chapters" description="Organise each subject into chapters and learning units." />
            <CrudManager
                title="Chapters"
                endpoint="/admin/chapters"
                fields={[
                    { name: 'subject_id', label: 'Subject', type: 'select', options: loadSubjects, source: 'subject.id', required: true },
                    { name: 'slug', label: 'Slug', required: true },
                    { name: 'title_en', label: 'Title (English)', required: true },
                    { name: 'title_km', label: 'Title (Khmer)', required: true },
                    { name: 'description_en', label: 'Description (English)', type: 'textarea' },
                    { name: 'description_km', label: 'Description (Khmer)', type: 'textarea' },
                    { name: 'sort_order', label: 'Sort order', type: 'number', min: 0 },
                    { name: 'is_active', label: 'Active', type: 'checkbox' },
                ]}
                columns={[
                    { key: 'title_en', label: 'Title (English)' },
                    { key: 'title_km', label: 'Title (Khmer)' },
                    { key: 'subject.name_en', label: 'Subject' },
                    { key: 'lessons_count', label: 'Lessons' },
                    { key: 'is_active', label: 'Active' },
                ]}
                filters={[{ name: 'subject_id', label: 'All subjects', options: subjectFilters }]}
                modalSize="lg"
            />
        </>
    );
}
