import { useEffect, useState } from 'react';
import { CrudManager } from '../../components/CrudManager';
import { Badge, PageHeader } from '../../components/ui';
import { usePageTitle } from '../../hooks/usePageTitle';
import { api, unwrap } from '../../lib/api';
import { loadTracks } from './config';

export default function AdminStudents() {
    usePageTitle('Students');
    const [trackFilters, setTrackFilters] = useState([]);

    useEffect(() => {
        loadTracks()
            .then((tracks) => setTrackFilters(tracks.map((track) => ({ value: track.value, label: track.label }))))
            .catch(() => setTrackFilters([]));
    }, []);

    return (
        <>
            <PageHeader title="Students" description="Review student accounts, change roles and deactivate access when needed." />
            <CrudManager
                title="Students"
                endpoint="/admin/students"
                creatable={false}
                createLabel="Add student"
                fields={[
                    { name: 'name', label: 'Full name', required: true },
                    { name: 'email', label: 'Email', type: 'email', required: true },
                    { name: 'phone', label: 'Phone' },
                    { name: 'study_track_id', label: 'Study track', type: 'select', options: loadTracks, source: 'study_track.id' },
                    { name: 'role', label: 'Role', type: 'select', options: [{ value: 'student', label: 'Student' }, { value: 'admin', label: 'Admin' }] },
                    { name: 'is_active', label: 'Active account', type: 'checkbox' },
                ]}
                columns={[
                    { key: 'name', label: 'Name' },
                    { key: 'email', label: 'Email' },
                    { key: 'study_track.name_en', label: 'Track' },
                    { key: 'role', label: 'Role', render: (row) => <Badge tone={row.role === 'admin' ? 'violet' : 'slate'}>{row.role}</Badge> },
                    { key: 'is_active', label: 'Status', render: (row) => <Badge tone={row.is_active ? 'green' : 'red'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
                ]}
                filters={[{ name: 'track_id', label: 'All tracks', options: trackFilters }]}
            />
        </>
    );
}
