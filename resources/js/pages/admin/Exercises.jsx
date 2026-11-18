import { useEffect, useState } from 'react';
import { CrudManager } from '../../components/CrudManager';
import { PageHeader } from '../../components/ui';
import { usePageTitle } from '../../hooks/usePageTitle';
import { loadChapters, loadLessons, loadSubjects } from './config';

const typeOptions = [
    { value: 'mcq', label: 'Multiple choice' },
    { value: 'true_false', label: 'True / False' },
    { value: 'short_answer', label: 'Short answer' },
    { value: 'numerical', label: 'Numerical' },
];

const difficultyOptions = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
];

function transformPayload(values) {
    const payload = { ...values };
    payload.accepted_answers = (values.accepted_answers || []).map((answer) => String(answer).trim()).filter(Boolean);

    if (['mcq', 'true_false'].includes(values.type)) {
        payload.options = (values.options || []).map((option, index) => ({
            option_km: option.option_km || '',
            option_en: option.option_en || '',
            is_correct: Boolean(option.is_correct),
            sort_order: index,
        }));
    } else {
        delete payload.options;
    }

    return payload;
}

export default function AdminExercises() {
    usePageTitle('Exercises');
    const [subjectFilters, setSubjectFilters] = useState([]);

    useEffect(() => {
        loadSubjects()
            .then(setSubjectFilters)
            .catch(() => setSubjectFilters([]));
    }, []);

    return (
        <>
            <PageHeader title="Exercise bank" description="Create practice questions reused by quizzes and mock exams. Correct answers stay hidden from students until submission." />
            <CrudManager
                title="Exercises"
                endpoint="/admin/exercises"
                fields={[
                    { name: 'subject_id', label: 'Subject', type: 'select', options: loadSubjects, source: 'subject.id', required: true },
                    { name: 'chapter_id', label: 'Chapter', type: 'select', options: loadChapters, source: 'chapter.id' },
                    { name: 'lesson_id', label: 'Lesson', type: 'select', options: loadLessons, source: 'lesson.id' },
                    { name: 'type', label: 'Question type', type: 'select', options: typeOptions, required: true },
                    { name: 'question_km', label: 'Question (Khmer)', type: 'textarea', rows: 3, required: true },
                    { name: 'question_en', label: 'Question (English)', type: 'textarea', rows: 3 },
                    { name: 'correct_answer', label: 'Correct answer', hint: 'Required for short answer and numerical questions.' },
                    { name: 'accepted_answers', label: 'Accepted alternative answers', type: 'lines', itemPlaceholder: 'Alternative answer' },
                    { name: 'explanation_km', label: 'Explanation (Khmer)', type: 'textarea' },
                    { name: 'explanation_en', label: 'Explanation (English)', type: 'textarea' },
                    { name: 'points', label: 'Points', type: 'number', min: 1, max: 100 },
                    { name: 'difficulty', label: 'Difficulty', type: 'select', options: difficultyOptions },
                    { name: 'sort_order', label: 'Sort order', type: 'number', min: 0 },
                    { name: 'is_published', label: 'Published', type: 'checkbox' },
                    {
                        name: 'options',
                        label: 'Answer options (choose exactly one correct option for MCQ / True-False)',
                        type: 'repeater',
                        itemDefaults: { option_km: '', option_en: '', is_correct: false },
                        itemFields: [
                            { name: 'option_km', label: 'Option (Khmer)' },
                            { name: 'option_en', label: 'Option (English)' },
                            { name: 'is_correct', label: 'Correct', type: 'correct' },
                        ],
                    },
                ]}
                columns={[
                    { key: 'question_km', label: 'Question' },
                    { key: 'type', label: 'Type', render: (row) => row.type?.replace('_', ' ') },
                    { key: 'subject.name_en', label: 'Subject' },
                    { key: 'points', label: 'Points' },
                    { key: 'difficulty', label: 'Difficulty' },
                    { key: 'is_published', label: 'Published' },
                ]}
                filters={[{ name: 'subject_id', label: 'All subjects', options: subjectFilters }]}
                transformPayload={transformPayload}
                modalSize="xl"
            />
        </>
    );
}
