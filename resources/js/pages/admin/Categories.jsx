import { ArrowRight, LibraryBig, Layers3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, LoadingState, PageHeader } from '../../components/ui';
import { usePageTitle } from '../../hooks/usePageTitle';
import { api, getErrorMessage, unwrap } from '../../lib/api';

export default function AdminCategories() {
    usePageTitle('Categories');
    const [tracks, setTracks] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([
            api.get('/admin/tracks', { params: { per_page: 50 } }),
            api.get('/admin/subjects', { params: { per_page: 50 } }),
        ])
            .then(([trackResponse, subjectResponse]) => {
                setTracks(unwrap(trackResponse) || []);
                setSubjects(unwrap(subjectResponse) || []);
            })
            .catch((loadError) => setError(getErrorMessage(loadError)))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    return (
        <>
            <PageHeader title="Categories" description="Study tracks and subjects define how students browse learning content." />
            <div className="grid gap-6 lg:grid-cols-2">
                <section className="card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <Layers3 className="size-5 text-brand-600" />
                            <h2 className="font-semibold">Study tracks</h2>
                        </div>
                        <Link to="/admin/tracks" className="text-sm text-brand-600 hover:underline">Manage <ArrowRight className="inline size-3.5" /></Link>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {tracks.map((track) => (
                            <div key={track.id} className="flex items-center justify-between px-5 py-3">
                                <div>
                                    <p className="text-sm font-medium">{track.name_en} / {track.name_km}</p>
                                    <p className="text-xs text-slate-500">{track.slug}</p>
                                </div>
                                <span className="text-xs text-slate-500">{track.subjects_count ?? 0} subjects</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <LibraryBig className="size-5 text-brand-600" />
                            <h2 className="font-semibold">Subjects</h2>
                        </div>
                        <Link to="/admin/subjects" className="text-sm text-brand-600 hover:underline">Manage <ArrowRight className="inline size-3.5" /></Link>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {subjects.map((subject) => (
                            <div key={subject.id} className="flex items-center justify-between px-5 py-3">
                                <div>
                                    <p className="text-sm font-medium">{subject.name_en} / {subject.name_km}</p>
                                    <p className="text-xs text-slate-500">{subject.study_track?.name_en || 'No track'}</p>
                                </div>
                                <span className="text-xs text-slate-500">{subject.chapters_count ?? 0} chapters</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}
