import { Lock, Save, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, Card, Input, Select } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { api, getErrorMessage, unwrap } from '../../lib/api';

function profileFromUser(user) {
    return {
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        locale: user?.locale ?? 'en',
        study_track_id: user?.study_track?.id ?? user?.study_track_id ?? '',
        avatar: null,
    };
}

export default function ProfilePage() {
    usePageTitle('My Profile');
    const { user, refreshUser } = useAuth();
    const { setLocale, t } = useLocale();
    const toast = useToast();
    const [profile, setProfile] = useState(() => profileFromUser(user));
    const [tracks, setTracks] = useState([]);
    const [password, setPassword] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        setProfile(profileFromUser(user));
    }, [user]);

    useEffect(() => {
        api.get('/tracks')
            .then((response) => setTracks(unwrap(response) || []))
            .catch(() => setTracks([]));
    }, []);

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
            const formData = new FormData();
            formData.append('name', profile.name);
            formData.append('email', profile.email);
            formData.append('phone', profile.phone || '');
            formData.append('locale', profile.locale);
            if (profile.study_track_id) {
                formData.append('study_track_id', profile.study_track_id);
            }
            if (profile.avatar instanceof File) {
                formData.append('avatar', profile.avatar);
            }

            await api.put('/profile', formData);
            await refreshUser();
            setLocale(profile.locale);
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
            const response = await api.put('/password', password);
            toast.success(response.data?.message || 'Password changed.');
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
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('Profile')}</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Manage your account details and password.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <Card>
                    <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4 dark:border-slate-700">
                        <User className="size-5 text-brand-600" />
                        <h2 className="font-semibold">Personal information</h2>
                    </div>

                    <form className="space-y-4" onSubmit={submitProfile}>
                        <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                            <Input label={t('Full name')} name="name" value={profile.name} onChange={updateProfile} required />
                            <Input label={t('Email')} name="email" type="email" value={profile.email} onChange={updateProfile} required />
                            <Input label="Phone" name="phone" value={profile.phone} onChange={updateProfile} />
                            <Select label={t('Study track')} name="study_track_id" value={profile.study_track_id} onChange={updateProfile}>
                                <option value="">No track selected</option>
                                {tracks.map((track) => (
                                    <option key={track.id} value={track.id}>{track.name_km || track.name_en}</option>
                                ))}
                            </Select>
                            <Select label={t('Language')} name="locale" value={profile.locale} onChange={updateProfile}>
                                <option value="en">English</option>
                                <option value="km">ខ្មែរ</option>
                            </Select>
                            <Input label="Avatar" name="avatar" type="file" accept="image/*" onChange={updateProfile} />
                        </div>
                        {user?.avatar_url && (
                            <img src={user.avatar_url} alt={user.name} className="size-20 rounded-full object-cover" />
                        )}
                        <Button type="submit" disabled={savingProfile}>
                            <Save className="size-4" />
                            {savingProfile ? 'Saving...' : t('Save')}
                        </Button>
                    </form>
                </Card>

                <Card className="h-fit">
                    <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4 dark:border-slate-700">
                        <Lock className="size-5 text-brand-600" />
                        <h2 className="font-semibold">Change password</h2>
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
                                setPassword((current) => ({ ...current, password: event.target.value }))
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
