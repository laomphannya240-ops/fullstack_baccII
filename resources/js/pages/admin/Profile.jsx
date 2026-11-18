import { useState } from 'react';
import { Lock, Save, UserRound } from 'lucide-react';
import { Button, Card, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorMessage, post, put } from '../../lib/api';

export default function AdminProfile() {
    usePageTitle('Admin Profile');
    const { user, refreshUser } = useAuth();
    const toast = useToast();
    const [profile, setProfile] = useState({
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        avatar: null,
    });
    const [password, setPassword] = useState({ current_password: '', password: '', password_confirmation: '' });
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    async function submitProfile(event) {
        event.preventDefault();
        setSavingProfile(true);

        try {
            const payload = new FormData();
            Object.entries(profile).forEach(([key, value]) => {
                if (value !== null && value !== '') {
                    payload.append(key, value);
                }
            });
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
                <h1 className="text-2xl font-semibold">Admin profile</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update your account details and password.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4 dark:border-slate-700">
                        <UserRound className="size-5 text-brand-600" />
                        <h2 className="font-semibold">Personal information</h2>
                    </div>
                    <form className="space-y-4" onSubmit={submitProfile}>
                        <Input label="Full name" name="name" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} required />
                        <Input label="Email" name="email" type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} required />
                        <Input label="Phone" name="phone" value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} />
                        <Input label="Avatar" name="avatar" type="file" accept="image/*" onChange={(event) => setProfile((current) => ({ ...current, avatar: event.target.files?.[0] ?? null }))} />
                        <Button type="submit" disabled={savingProfile}>
                            <Save className="size-4" /> {savingProfile ? 'Saving...' : 'Save changes'}
                        </Button>
                    </form>
                </Card>

                <Card className="h-fit">
                    <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4 dark:border-slate-700">
                        <Lock className="size-5 text-brand-600" />
                        <h2 className="font-semibold">Change password</h2>
                    </div>
                    <form className="space-y-4" onSubmit={submitPassword}>
                        <Input label="Current password" name="current_password" type="password" value={password.current_password} onChange={(event) => setPassword((current) => ({ ...current, current_password: event.target.value }))} required />
                        <Input label="New password" name="password" type="password" value={password.password} onChange={(event) => setPassword((current) => ({ ...current, password: event.target.value }))} required />
                        <Input label="Confirm new password" name="password_confirmation" type="password" value={password.password_confirmation} onChange={(event) => setPassword((current) => ({ ...current, password_confirmation: event.target.value }))} required />
                        <Button type="submit" disabled={savingPassword} className="w-full">{savingPassword ? 'Changing...' : 'Change password'}</Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
