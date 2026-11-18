import { GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, Card, PageHeader, Select } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { api, getErrorMessage, unwrap } from '../../lib/api';

export default function SelectTrackPage() {
    usePageTitle('Select Track');
    const { user, refreshUser } = useAuth();
    const toast = useToast();
    const [tracks, setTracks] = useState([]);
    const [trackId, setTrackId] = useState(String(user?.study_track?.id || ''));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/tracks')
            .then((response) => setTracks(unwrap(response) || []))
            .catch((loadError) => toast.error(getErrorMessage(loadError)));
    }, [toast]);

    async function submit(event) {
        event.preventDefault();
        setSaving(true);
        try {
            const response = await api.put('/select-track', { study_track_id: trackId });
            await refreshUser();
            toast.success(response.data?.message || 'Study track updated.');
        } catch (saveError) {
            toast.error(getErrorMessage(saveError));
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <PageHeader title="Select your study track" description="Your track filters the subjects, exercises and exams shown to you." />
            <Card className="mx-auto max-w-xl">
                <form className="space-y-5" onSubmit={submit}>
                    <Select label="Study track" value={trackId} onChange={(event) => setTrackId(event.target.value)} required>
                        <option value="">Choose a track</option>
                        {tracks.map((track) => (
                            <option key={track.id} value={track.id}>{track.name_en} / {track.name_km}</option>
                        ))}
                    </Select>
                    <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-900 dark:bg-brand-900/30 dark:text-brand-100">
                        <p className="flex items-center gap-2 font-medium"><GraduationCap className="size-4" /> Science or Social Science</p>
                        <p className="mt-1 text-xs">You can change your track later from your profile.</p>
                    </div>
                    <Button type="submit" disabled={saving || !trackId}>{saving ? 'Saving...' : 'Save track'}</Button>
                </form>
            </Card>
        </>
    );
}
