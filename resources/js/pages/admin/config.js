import { api, unwrap } from '../../lib/api';

async function collection(endpoint, params = {}) {
    const response = await api.get(endpoint, { params: { per_page: 100, ...params } });

    return unwrap(response) || [];
}

export const loadTracks = () => collection('/admin/tracks').then((tracks) => tracks.map((track) => ({
    value: track.id,
    label: track.name_en || track.name_km || track.slug,
})));

export const loadSubjects = () => collection('/admin/subjects').then((subjects) => subjects.map((subject) => ({
    value: subject.id,
    label: subject.name_en || subject.name_km || subject.slug,
})));

export const loadChapters = async () => {
    const subjects = await collection('/admin/subjects');
    const chapters = await Promise.all(subjects.map((subject) => collection('/admin/chapters', { subject_id: subject.id })));

    return chapters.flat().map((chapter) => ({
        value: chapter.id,
        label: `${chapter.subject?.name_en || 'Subject'} · ${chapter.title_en || chapter.title_km}`,
    }));
};

export const loadLessons = async () => {
    const subjects = await collection('/admin/subjects');
    const chapters = await Promise.all(subjects.map((subject) => collection('/admin/chapters', { subject_id: subject.id })));
    const flatChapters = chapters.flat();
    const lessons = await Promise.all(flatChapters.map((chapter) => collection('/admin/lessons', { chapter_id: chapter.id })));

    return lessons.flat().map((lesson) => ({
        value: lesson.id,
        label: `${lesson.chapter?.title_en || 'Chapter'} · ${lesson.title_en || lesson.title_km}`,
    }));
};

export const loadExercises = () => collection('/admin/exercises').then((exercises) => exercises.map((exercise) => ({
    value: exercise.id,
    label: `${exercise.subject?.name_en || 'Subject'} · ${(exercise.question_km || exercise.question_en || '').slice(0, 70)}`,
})));

export function toFormData(values, skipEmpty = true) {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
        if (value === null || value === undefined || value instanceof File === false && typeof value === 'object') {
            return;
        }

        if (skipEmpty && value === '') {
            return;
        }

        formData.append(key, value instanceof File ? value : String(value));
    });

    return formData;
}
