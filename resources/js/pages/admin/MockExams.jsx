import { useEffect, useState } from 'react';
import { CrudManager } from '../../components/CrudManager';
import { PageHeader } from '../../components/ui';
import { usePageTitle } from '../../hooks/usePageTitle';
import { loadExercises, loadSubjects } from './config';

export default function AdminMockExams() {
    usePageTitle('Mock Exams');
    const [subjectFilters, setSubjectFilters] = useState([]);

    useEffect(() => {
        loadSubjects()
            .then(setSubjectFilters)
            .catch(() => setSubjectFilters([]));
    }, []);

    return (
        <>
            <PageHeader title="Mock exams" description="Create timed full-length practice exams from published exercises." />
            <CrudManager
                title="Mock exams"
                endpoint="/admin/mock-exams"
                fields={[
                    { name: 'subject_id', label: 'Subject', type: 'select', options: loadSubjects, source: 'subject.id', required: true },
                    { name: 'title_en', label: 'Title (English)', required: true },
                    { name: 'title_km', label: 'Title (Khmer)', required: true },
                    { name: 'description_en', label: 'Description (English)', type: 'textarea' },
                    { name: 'description_km', label: 'Description (Khmer)', type: 'textarea' },
                    { name: 'question_count', label: 'Questions per attempt', type: 'number', min: 1, max: 200 },
                    { name: 'duration_minutes', label: 'Duration (minutes)', type: 'number', min: 1, max: 300 },
                    { name: 'passing_score', label: 'Passing score (%)', type: 'number', min: 0, max: 100 },
                    { name: 'exercise_ids', label: 'Question bank', type: 'multi-select', options: loadExercises, hint: 'Hold Ctrl/Cmd to select several exercises.' },
                    { name: 'is_active', label: 'Active', type: 'checkbox' },
                ]}
                columns={[
                    { key: 'title_en', label: 'Title (English)' },
                    { key: 'title_km', label: 'Title (Khmer)' },
                    { key: 'subject.name_en', label: 'Subject' },
                    { key: 'questions_count', label: 'Questions' },
                    { key: 'duration_minutes', label: 'Minutes' },
                    { key: 'is_active', label: 'Active' },
                ]}
                filters={[{ name: 'subject_id', label: 'All subjects', options: subjectFilters }]}
                transformPayload={(values) => ({ ...values, exercise_ids: (values.exercise_ids || []).map(Number) })}
                modalSize="xl"
            />
        </>
    );
}
