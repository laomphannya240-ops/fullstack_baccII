import { CrudManager } from '../../components/CrudManager';
import { usePageTitle } from '../../hooks/usePageTitle';
import { loadChapters, toFormData } from './config';

export default function AdminReference() {
    usePageTitle('Reference content');

    return (
        <CrudManager
            title="Reference content"
            description="Manage short formula sheets, definitions, summaries, dates and exam notes shown in Formula / Theory."
            endpoint="/admin/lessons"
            fixedParams={{ is_reference: true }}
            defaults={{ is_reference: true, estimated_minutes: 5 }}
            fields={[
                { name: 'chapter_id', label: 'Chapter', type: 'select', options: loadChapters, source: 'chapter.id', required: true },
                { name: 'slug', label: 'Slug', required: true },
                { name: 'title_en', label: 'Title (English)', required: true },
                { name: 'title_km', label: 'Title (Khmer)', required: true },
                { name: 'summary_en', label: 'Summary (English)', type: 'textarea' },
                { name: 'summary_km', label: 'Summary (Khmer)', type: 'textarea' },
                { name: 'content_en', label: 'Reference content (English)', type: 'textarea', rows: 10, hint: 'Supports $inline$ and $$block$$ KaTeX math.' },
                { name: 'content_km', label: 'Reference content (Khmer)', type: 'textarea', rows: 10 },
                { name: 'important_notes', label: 'Key facts / exam notes', type: 'textarea' },
                { name: 'pdf', label: 'PDF file', type: 'file', accept: 'application/pdf' },
                { name: 'sort_order', label: 'Sort order', type: 'number', min: 0 },
                { name: 'estimated_minutes', label: 'Estimated minutes', type: 'number', min: 1, max: 600 },
                { name: 'is_published', label: 'Published', type: 'checkbox' },
                { name: 'is_reference', label: 'Reference sheet', type: 'checkbox' },
            ]}
            columns={[
                { key: 'title_en', label: 'Title (English)' },
                { key: 'title_km', label: 'Title (Khmer)' },
                { key: 'chapter.subject.name_en', label: 'Subject' },
                { key: 'chapter.title_en', label: 'Chapter' },
                { key: 'is_published', label: 'Published' },
            ]}
            transformPayload={(values) => toFormData(values)}
            modalSize="xl"
        />
    );
}
