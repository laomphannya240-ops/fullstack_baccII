import { useMemo, useState } from 'react';
import { Lock, Save, User } from 'lucide-react';
import { Button, Card, Input, Select } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorMessage, post, put } from '../../lib/api';

export default function ProfilePage() {
    usePageTitle('My Profile');
    const { user, refreshUser } = useAuth();
    const toast = useToast();
    const [profile, setProfile] = useState({
        name: user?.name ?? '',
        phone: user?.phone ?? '',
        avatar: null,
        school_name: user?.school_name ?? '',
        grade_level: user?.grade_level ?? '',
        study_track_id: user?.study_track?.id ?? '',
        preferred_language: user?.preferred_language ?? 'en',
        exam_date: user?.exam_date ?? '',
        goals: user?.goals ?? '',
    });
    const [password, setPassword] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    const tracks = useMemo(() => user?.available_tracks ?? [], [user]);

    function updateProfile(event) {
        const { name, value, files } = event.target;
        setProfile((current) => ({
            ...current,
            [name]: name === 'avatar' ? (files?.[0] ?? null) : value,
        }));
    }

    async function submitProfile(event) {
        event.preventDefault();
        setSavingProfile(true);

        try {
            const payload = new FormData();
            for (const [key, value] of Object.entries(profile)) {
                if (value !== null && value !== '') {
                    payload.append(key, value);
                }
            }
            payload.append('_method', 'PUT');

            await post('/profile', payload);
            await refreshUser();
            toast.success('Profile updated.');
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setSavingProfile(false);
        }
    }

    async function submitPassword(event) {
        event.preventDefault();
        setSavingPassword(true);

        try {
            const response = await put('/password', password);
            toast.success(response.message ?? 'Password changed.');
            setPassword({ current_password: '', password: '', password_confirmation: '' });
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setSavingPassword(false);
        }
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">My Profile</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Manage your personal details and account security.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <Card>
                    <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4 dark:border-slate-700">
                        <User className="h-5 w-5 text-blue-600" />
                        <h2 className="font-semibold text-slate-900 dark:text-white">Personal information</h2>
                    </div>

                    <form className="space-y-4" onSubmit={submitProfile}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input label="Full name" name="name" value={profile.name} onChange={updateProfile} required />
                            <Input label="Phone" name="phone" value={profile.phone} onChange={updateProfile} />
                            <Input label="School" name="school_name" value={profile.school_name} onChange={updateProfile} />
                            <Input
                                label="Grade level"
                                name="grade_level"
                                value={profile.grade_level}
                                onChange={updateProfile}
                            />
                            <Select
                                label="Study track"
                                name="study_track_id"
                                value={profile.study_track_id}
                                onChange={updateProfile}
                            >
                                <option value="">Select track</option>
                                {tracks.map((track) => (
                                    <option key={track.id} value={track.id}>
                                        {track.name}
                                    </option>
                                ))}
                            </Select>
                            <Select
                                label="Preferred language"
                                name="preferred_language"
                                value={profile.preferred_language}
                                onChange={updateProfile}
                            >
                                <option value="en">English</option>
                                <option value="km">ខ្មែរ</option>
                            </Select>
                            <Input
                                label="Exam date"
                                name="exam_date"
                                type="date"
                                value={profile.exam_date}
                                onChange={updateProfile}
                            />
                            <Input
                                label="Avatar"
                                name="avatar"
                                type="file"
                                accept="image/*"
                                onChange={updateProfile}
                            />
                        </div>
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Goals
                            </span>
                            <textarea
                                name="goals"
                                rows={3}
                                value={profile.goals}
                                onChange={updateProfile}
                                className="input-field"
                            />
                        </label>
                        <Button type="submit" disabled={savingProfile}>
                            <Save className="h-4 w-4" />
                            {savingProfile ? 'Saving...' : 'Save changes'}
                        </Button>
                    </form>
                </Card>

                <Card className="h-fit">
                    <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4 dark:border-slate-700">
                        <Lock className="h-5 w-5 text-blue-600" />
                        <h2 className="font-semibold text-slate-900 dark:text-white">Change password</h2>
                    </div>

                    <form className="space-y-4" onSubmit={submitPassword}>
                        <Input
                            label="Current password"
                            name="current_password"
                            type="password"
                            value={password.current_password}
                            onChange={(event) =>
                                setPassword((current) => ({ ...current, current_password: event.target.value }))
                            }
                            required
                        />
                        <Input
                            label="New password"
                            name="password"
                            type="password"
                            value={password.password}
                            onChange={(event) => setPassword((current) => ({ ...current, password: event.target.value }))}
                            required
                        />
                        <Input
                            label="Confirm new password"
                            name="password_confirmation"
                            type="password"
                            value={password.password_confirmation}
                            onChange={(event) =>
                                setPassword((current) => ({ ...current, password_confirmation: event.target.value }))
                            }
                            required
                        />
                        <Button type="submit" disabled={savingPassword} className="w-full">
                            {savingPassword ? 'Changing...' : 'Change password'}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
