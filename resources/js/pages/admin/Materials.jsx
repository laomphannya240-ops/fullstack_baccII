import { useEffect, useState } from 'react';
import { CrudManager } from '../../components/CrudManager';
import { PageHeader } from '../../components/ui';
import { usePageTitle } from '../../hooks/usePageTitle';
import { loadChapters, loadSubjects, toFormData } from './config';

export default function AdminMaterials() {
    usePageTitle('Materials');
    const [subjectFilters, setSubjectFilters] = useState([]);

    useEffect(() => {
        loadSubjects()
            .then(setSubjectFilters)
            .catch(() => setSubjectFilters([]));
    }, []);

    return (
        <>
            <PageHeader title="Study materials" description="Upload revision notes, formula sheets and guides for students to download." />
            <CrudManager
                title="Materials"
                endpoint="/admin/materials"
                fields={[
                    { name: 'subject_id', label: 'Subject', type: 'select', options: loadSubjects, source: 'subject.id' },
                    { name: 'chapter_id', label: 'Chapter', type: 'select', options: loadChapters, source: 'chapter.id' },
                    { name: 'title_en', label: 'Title (English)', required: true },
                    { name: 'title_km', label: 'Title (Khmer)', required: true },
                    { name: 'description', label: 'Description', type: 'textarea' },
                    { name: 'file', label: 'File (PDF, Word, PowerPoint or image)', type: 'file', accept: '.pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg', required: true },
                    { name: 'is_published', label: 'Published', type: 'checkbox' },
                ]}
                columns={[
                    { key: 'title_en', label: 'Title (English)' },
                    { key: 'title_km', label: 'Title (Khmer)' },
                    { key: 'subject.name_en', label: 'Subject' },
                    { key: 'file_type', label: 'Type' },
                    { key: 'is_published', label: 'Published' },
                ]}
                filters={[{ name: 'subject_id', label: 'All subjects', options: subjectFilters }]}
                transformPayload={(values) => toFormData(values)}
                modalSize="lg"
            />
        </>
    );
}
