import {
    BookOpen,
    CalendarClock,
    ChevronDown,
    ClipboardList,
    FileText,
    GraduationCap,
    Landmark,
    LayoutDashboard,
    LibraryBig,
    LogOut,
    Menu,
    Megaphone,
    Moon,
    NotebookPen,
    Settings2,
    Sun,
    TrendingUp,
    UserRound,
    UsersRound,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { useTheme } from '../contexts/ThemeContext';
import WelcomePopup from './WelcomePopup';

function Logo({ compact = false }) {
    return (
        <Link to="/" className="flex items-center gap-2.5 font-bold">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
                <GraduationCap className="size-5" />
            </span>
            {!compact && (
                <span className="leading-tight">
                    <span className="block text-sm sm:text-base">BAC II StudyHub</span>
                    <span className="block text-[10px] font-medium uppercase tracking-wider text-brand-600 dark:text-brand-400">
                        Cambodia Grade 12
                    </span>
                </span>
            )}
        </Link>
    );
}

function ThemeControls() {
    const { resolvedTheme, toggleTheme } = useTheme();
    const { locale, setLocale } = useLocale();

    return (
        <div className="flex items-center gap-1">
            <button
                type="button"
                onClick={() => setLocale(locale === 'km' ? 'en' : 'km')}
                className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                title={locale === 'km' ? 'Switch to English' : 'ប្ដូរទៅខ្មែរ'}
            >
                {locale === 'km' ? 'EN' : 'KM'}
            </button>
            <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Toggle dark mode"
            >
                {resolvedTheme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </button>
        </div>
    );
}

function NavItem({ to, icon: Icon, label, end = false, onClick }) {
    return (
        <NavLink
            to={to}
            end={end}
            onClick={onClick}
            className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
            }
        >
            {Icon && <Icon className="size-4.5 shrink-0" />}
            <span>{label}</span>
        </NavLink>
    );
}

function UserMenu() {
    const { user, logout, isAdmin } = useAuth();
    const { t } = useLocale();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 py-1.5 pl-1.5 pr-2.5 text-sm transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
                <span className="grid size-7 place-items-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/50 dark:text-brand-200">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
                <span className="hidden max-w-28 truncate sm:block">{user?.name}</span>
                <ChevronDown className="size-3.5 text-slate-400" />
            </button>
            {open && (
                <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                        <p className="truncate text-sm font-semibold">{user?.name}</p>
                        <p className="truncate text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <NavItem to={isAdmin ? '/admin/profile' : '/app/profile'} icon={UserRound} label={t('Profile')} onClick={() => setOpen(false)} />
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                        <LogOut className="size-4.5" />
                        {t('Log out')}
                    </button>
                </div>
            )}
        </div>
    );
}

export function PublicLayout() {
    const { initializing, isAuthenticated, isAdmin } = useAuth();
    const { t } = useLocale();
    const [mobileOpen, setMobileOpen] = useState(false);

    const links = [
        { to: '/', label: 'Home', end: true },
        { to: '/subjects', label: 'Subjects' },
        { to: '/materials', label: 'Materials' },
        { to: '/announcements', label: 'Announcements' },
    ];

    return (
        <div className="min-h-screen">
            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/85">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <Logo />
                    <nav className="hidden items-center gap-1 lg:flex">
                        {links.map((link) => (
                            <NavItem key={link.to} {...link} label={t(link.label)} />
                        ))}
                    </nav>
                    <div className="flex items-center gap-2">
                        <ThemeControls />
                        {isAuthenticated ? (
                            <Link to={isAdmin ? '/admin' : '/app'} className="btn-primary hidden sm:inline-flex">
                                {t('Dashboard')}
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="btn-secondary hidden sm:inline-flex">
                                    {t('Login')}
                                </Link>
                                <Link to="/register" className="btn-primary">
                                    {t('Register')}
                                </Link>
                            </>
                        )}
                        <button type="button" className="rounded-lg p-2 lg:hidden" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle navigation">
                            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                        </button>
                    </div>
                </div>
                {mobileOpen && (
                    <nav className="border-t border-slate-200 bg-white p-3 lg:hidden dark:border-slate-800 dark:bg-slate-950">
                        {links.map((link) => (
                            <NavItem key={link.to} {...link} label={t(link.label)} onClick={() => setMobileOpen(false)} />
                        ))}
                        {isAuthenticated && <NavItem to={isAdmin ? '/admin' : '/app'} icon={LayoutDashboard} label={t('Dashboard')} onClick={() => setMobileOpen(false)} />}
                    </nav>
                )}
            </header>
            <main>
                <Outlet />
            </main>
            <footer className="mt-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400">
                    <p>© {new Date().getFullYear()} BAC II StudyHub · Built for Cambodian Grade 12 students.</p>
                    <p className="text-xs">Demo content is for practice only and is not official exam material.</p>
                </div>
            </footer>
            {!initializing && !isAuthenticated && <WelcomePopup />}
        </div>
    );
}

function DashboardShell({ role }) {
    const { t } = useLocale();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isAdmin = role === 'admin';

    const studentLinks = [
        { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/app/science', icon: LibraryBig, label: 'Science' },
        { to: '/app/social-science', icon: Landmark, label: 'Social Science' },
        { to: '/app/exercises', icon: NotebookPen, label: 'Practice Exercises' },
        { to: '/app/reference', icon: BookOpen, label: 'Formula / Theory' },
        { to: '/app/materials', icon: FileText, label: 'Materials' },
        { to: '/app/progress', icon: TrendingUp, label: 'My Progress' },
        { to: '/app/profile', icon: UserRound, label: 'Profile' },
    ];

    const adminLinks = [
        { to: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard', end: true },
        { to: '/admin/students', icon: UsersRound, label: 'Students' },
        { to: '/admin/tracks', icon: Settings2, label: 'Tracks' },
        { to: '/admin/categories', icon: BookOpen, label: 'Categories' },
        { to: '/admin/subjects', icon: LibraryBig, label: 'Subjects' },
        { to: '/admin/chapters', icon: BookOpen, label: 'Chapters' },
        { to: '/admin/lessons', icon: NotebookPen, label: 'Lessons' },
        { to: '/admin/reference', icon: BookOpen, label: 'Reference content' },
        { to: '/admin/exercises', icon: ClipboardList, label: 'Exercises' },
        { to: '/admin/exercise-results', icon: ClipboardList, label: 'Exercise results' },
        { to: '/admin/quizzes', icon: ClipboardList, label: 'Quizzes' },
        { to: '/admin/exams', icon: CalendarClock, label: 'Mock Exams' },
        { to: '/admin/materials', icon: FileText, label: 'Materials' },
        { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
        { to: '/admin/progress', icon: TrendingUp, label: 'Progress' },
    ];

    const links = isAdmin ? adminLinks : studentLinks;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {sidebarOpen && <button type="button" className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" />}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 dark:border-slate-800 dark:bg-slate-900 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
                    <Logo />
                    <button type="button" className="rounded-lg p-1.5 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
                        <X className="size-5" />
                    </button>
                </div>
                <div className="px-3 py-2">
                    <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {isAdmin ? 'Administration' : 'Learning space'}
                    </p>
                    <nav className="space-y-0.5">
                        {links.map((link) => (
                            <NavItem key={link.to} {...link} label={t(link.label)} onClick={() => setSidebarOpen(false)} />
                        ))}
                    </nav>
                </div>
                <div className="mt-auto border-t border-slate-200 p-3 dark:border-slate-800">
                    <NavItem to={isAdmin ? '/admin/profile' : '/app/profile'} icon={UserRound} label={t('Profile')} />
                </div>
            </aside>
            <div className="lg:pl-64">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-lg sm:px-6 dark:border-slate-800 dark:bg-slate-900/90">
                    <button type="button" className="rounded-lg p-2 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
                        <Menu className="size-5" />
                    </button>
                    <div className="ml-auto flex items-center gap-2">
                        <ThemeControls />
                        <UserMenu />
                    </div>
                </header>
                <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export function StudentLayout() {
    return <DashboardShell role="student" />;
}

export function AdminLayout() {
    return <DashboardShell role="admin" />;
}
