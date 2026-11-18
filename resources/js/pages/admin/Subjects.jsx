import { useEffect, useState } from 'react';
import { CrudManager } from '../../components/CrudManager';
import { PageHeader } from '../../components/ui';
import { usePageTitle } from '../../hooks/usePageTitle';
import { loadTracks } from './config';

export default function AdminSubjects() {
    usePageTitle('Subjects');
    const [trackFilters, setTrackFilters] = useState([]);

    useEffect(() => {
        loadTracks()
            .then((tracks) => setTrackFilters(tracks.map((track) => ({ value: track.value, label: track.label }))))
            .catch(() => setTrackFilters([]));
    }, []);

    return (
        <>
            <PageHeader title="Subjects" description="Manage subjects, their bilingual names and display settings." />
            <CrudManager
                title="Subjects"
                endpoint="/admin/subjects"
                fields={[
                    { name: 'study_track_id', label: 'Study track', type: 'select', options: loadTracks, source: 'study_track.id', required: true },
                    { name: 'slug', label: 'Slug', required: true },
                    { name: 'name_en', label: 'Name (English)', required: true },
                    { name: 'name_km', label: 'Name (Khmer)', required: true },
                    { name: 'description_en', label: 'Description (English)', type: 'textarea' },
                    { name: 'description_km', label: 'Description (Khmer)', type: 'textarea' },
                    { name: 'icon', label: 'Icon name' },
                    { name: 'color', label: 'Theme colour', placeholder: '#1f6f5f' },
                    { name: 'sort_order', label: 'Sort order', type: 'number', min: 0 },
                    { name: 'is_active', label: 'Active', type: 'checkbox' },
                ]}
                columns={[
                    { key: 'name_en', label: 'Name (English)' },
                    { key: 'name_km', label: 'Name (Khmer)' },
                    { key: 'study_track.name_en', label: 'Track' },
                    { key: 'chapters_count', label: 'Chapters' },
                    { key: 'lessons_count', label: 'Lessons' },
                    { key: 'exercises_count', label: 'Exercises' },
                    { key: 'is_active', label: 'Active' },
                ]}
                filters={[{ name: 'track_id', label: 'All tracks', options: trackFilters }]}
                modalSize="lg"
            />
        </>
    );
}
