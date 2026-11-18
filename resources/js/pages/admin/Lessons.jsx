import { useEffect, useState } from 'react';
import { CrudManager } from '../../components/CrudManager';
import { PageHeader } from '../../components/ui';
import { usePageTitle } from '../../hooks/usePageTitle';
import { loadChapters, loadSubjects, toFormData } from './config';

export default function AdminLessons() {
    usePageTitle('Lessons');
    const [subjectFilters, setSubjectFilters] = useState([]);

    useEffect(() => {
        loadSubjects()
            .then(setSubjectFilters)
            .catch(() => setSubjectFilters([]));
    }, []);

    return (
        <>
            <PageHeader title="Lessons" description="Write bilingual lesson content, attach PDFs and publish learning material." />
            <CrudManager
                title="Lessons"
                endpoint="/admin/lessons"
                fields={[
                    { name: 'chapter_id', label: 'Chapter', type: 'select', options: loadChapters, source: 'chapter.id', required: true },
                    { name: 'slug', label: 'Slug', required: true },
                    { name: 'title_en', label: 'Title (English)', required: true },
                    { name: 'title_km', label: 'Title (Khmer)', required: true },
                    { name: 'summary_en', label: 'Summary (English)', type: 'textarea' },
                    { name: 'summary_km', label: 'Summary (Khmer)', type: 'textarea' },
                    { name: 'content_en', label: 'Content (English)', type: 'textarea', rows: 8, hint: 'Supports $inline$ and $$block$$ KaTeX math.' },
                    { name: 'content_km', label: 'Content (Khmer)', type: 'textarea', rows: 8 },
                    { name: 'important_notes', label: 'Important notes', type: 'textarea' },
                    { name: 'video_url', label: 'Video URL', type: 'url' },
                    { name: 'pdf', label: 'PDF file', type: 'file', accept: 'application/pdf' },
                    { name: 'sort_order', label: 'Sort order', type: 'number', min: 0 },
                    { name: 'estimated_minutes', label: 'Estimated minutes', type: 'number', min: 1, max: 600 },
                    { name: 'is_published', label: 'Published', type: 'checkbox' },
                ]}
                columns={[
                    { key: 'title_en', label: 'Title (English)' },
                    { key: 'title_km', label: 'Title (Khmer)' },
                    { key: 'chapter.title_en', label: 'Chapter' },
                    { key: 'estimated_minutes', label: 'Minutes' },
                    { key: 'is_published', label: 'Published' },
                ]}
                filters={[{ name: 'subject_id', label: 'All subjects', options: subjectFilters }]}
                transformPayload={(values) => toFormData(values)}
                modalSize="xl"
            />
        </>
    );
}
