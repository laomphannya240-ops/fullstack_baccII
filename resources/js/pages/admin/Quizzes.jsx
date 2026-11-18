import { useEffect, useState } from 'react';
import { CrudManager } from '../../components/CrudManager';
import { PageHeader } from '../../components/ui';
import { usePageTitle } from '../../hooks/usePageTitle';
import { loadChapters, loadExercises, loadLessons, loadSubjects } from './config';

export default function AdminQuizzes() {
    usePageTitle('Quizzes');
    const [subjectFilters, setSubjectFilters] = useState([]);

    useEffect(() => {
        loadSubjects()
            .then(setSubjectFilters)
            .catch(() => setSubjectFilters([]));
    }, []);

    return (
        <>
            <PageHeader title="Quizzes" description="Build quizzes from the exercise bank and set duration and passing score." />
            <CrudManager
                title="Quizzes"
                endpoint="/admin/quizzes"
                fields={[
                    { name: 'subject_id', label: 'Subject', type: 'select', options: loadSubjects, source: 'subject.id' },
                    { name: 'chapter_id', label: 'Chapter', type: 'select', options: loadChapters, source: 'chapter.id' },
                    { name: 'lesson_id', label: 'Lesson', type: 'select', options: loadLessons, source: 'lesson.id' },
                    { name: 'title_en', label: 'Title (English)', required: true },
                    { name: 'title_km', label: 'Title (Khmer)', required: true },
                    { name: 'description_en', label: 'Description (English)', type: 'textarea' },
                    { name: 'description_km', label: 'Description (Khmer)', type: 'textarea' },
                    { name: 'question_count', label: 'Questions per attempt', type: 'number', min: 1, max: 100 },
                    { name: 'duration_minutes', label: 'Duration (minutes)', type: 'number', min: 1, max: 300 },
                    { name: 'passing_score', label: 'Passing score (%)', type: 'number', min: 0, max: 100 },
                    { name: 'exercise_ids', label: 'Question bank', type: 'multi-select', options: loadExercises, hint: 'Select one or more exercises. Hold Ctrl/Cmd to select several.' },
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
