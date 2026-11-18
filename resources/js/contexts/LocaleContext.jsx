import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const LOCALE_KEY = 'bacii_studyhub.locale';

const translations = {
    km: {
        Dashboard: 'ផ្ទាំងគ្រប់គ្រង',
        Subjects: 'មុខវិជ្ជា',
        Lessons: 'មេរៀន',
        Exercises: 'លំហាត់',
        Quizzes: 'សំណួរ',
        'Mock Exams': 'ការប្រឡងសាកល្បង',
        Progress: 'វឌ្ឍនភាព',
        Bookmarks: 'ចំណាំ',
        Materials: 'ឯកសារ',
        Announcements: 'ការប្រកាស',
        Profile: 'ប្រវត្តិរូប',
        History: 'ប្រវត្តិ',
        Students: 'សិស្ស',
        Tracks: 'ជំនាញ',
        Categories: 'ប្រភេទ',
        Chapters: 'ជំពូក',
        'Exam Questions': 'សំណួរប្រឡង',
        'Admin Dashboard': 'ផ្ទាំងអ្នកគ្រប់គ្រង',
        'Performance': 'ការអនុវត្ត',
        Login: 'ចូលប្រើ',
        Register: 'ចុះឈ្មោះ',
        'Log out': 'ចេញពីប្រព័ន្ធ',
        Search: 'ស្វែងរក',
        'All tracks': 'គ្រប់ជំនាញ',
        'All subjects': 'គ្រប់មុខវិជ្ជា',
        Start: 'ចាប់ផ្ដើម',
        Submit: 'ដាក់ជូន',
        'Next question': 'សំណួរបន្ទាប់',
        'Previous question': 'សំណួរមុន',
        'Your answer': 'ចម្លើយរបស់អ្នក',
        'Correct answer': 'ចម្លើយត្រឹមត្រូវ',
        Explanation: 'ការពន្យល់',
        Score: 'ពិន្ទុ',
        'No results found': 'រកមិនឃើញលទ្ធផល',
        Loading: 'កំពុងផ្ទុក...',
        Save: 'រក្សាទុក',
        Cancel: 'បោះបង់',
        Delete: 'លុប',
        Edit: 'កែសម្រួល',
        Create: 'បង្កើត',
        Add: 'បន្ថែម',
        Close: 'បិទ',
        'Create your account': 'បង្កើតគណនីរបស់អ្នក',
        'Welcome back': 'សូមស្វាគមន៍មកកាន់',
        Email: 'អ៊ីមែល',
        Password: 'ពាក្យសម្ងាត់',
        'Confirm password': 'បញ្ជាក់ពាក្យសម្ងាត់',
        'Full name': 'ឈ្មោះពេញ',
        'Select your track': 'ជ្រើសរើសជំនាញរបស់អ្នក',
        'Continue with Google': 'បន្តជាមួយ Google',
        'Forgot password?': 'ភ្លេចពាក្យសម្ងាត់?',
        'Remember me': 'ចងចាំខ្ញុំ',
        'Don’t have an account?': 'មិនទាន់មានគណនី?',
        'Already have an account?': 'មានគណនីរួចហើយ?',
        'License': 'អាជ្ញាប័ណ្ណ',
        'Written by': 'សរសេរដោយ',
        'Published': 'បានបោះពុម្ព',
        'Mark complete': 'សម្គាល់ថាបានបញ្ចប់',
        Completed: 'បានបញ្ចប់',
        'Not started': 'មិនទាន់ចាប់ផ្ដើម',
        'In progress': 'កំពុងដំណើរការ',
        'View all': 'មើលទាំងអស់',
        'Back to': 'ត្រឡប់ទៅ',
        'Time left': 'ពេលវេលាដែលនៅសល់',
        'Questions': 'សំណួរ',
        'Minutes': 'នាទី',
        'Attempts': 'ឱកាស',
        'Best score': 'ពិន្ទុល្អបំផុត',
        'Average score': 'ពិន្ទុមធ្យម',
        'Correct': 'ត្រឹមត្រូវ',
        'Incorrect': 'មិនត្រឹមត្រូវ',
        'Total': 'សរុប',
        'Download': 'ទាញយក',
        'Demo content': 'ខ្លឹមសារសាកល្បង',
        'Khmer': 'ខ្មែរ',
        'English': 'អង់គ្លេស',
        'Science': 'វិទ្យាសាស្ត្រ',
        'Social Science': 'វិទ្យាសាស្ត្រសង្គម',
    },
};

const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
    const [locale, setLocale] = useState(() => localStorage.getItem(LOCALE_KEY) || 'en');

    useEffect(() => {
        localStorage.setItem(LOCALE_KEY, locale);
        document.documentElement.lang = locale === 'km' ? 'km' : 'en';
    }, [locale]);

    const t = useCallback(
        (key) => (locale === 'km' ? translations.km[key] || key : key),
        [locale],
    );

    const pick = useCallback(
        (value, field = 'name') => {
            if (typeof value === 'string') {
                return value;
            }

            if (!value) {
                return '';
            }

            return value[`${field}_${locale}`] || value[`${field}_en`] || value[`${field}_km`] || '';
        },
        [locale],
    );

    const formatDate = useCallback(
        (value) => {
            if (!value) {
                return '—';
            }

            return new Intl.DateTimeFormat(locale === 'km' ? 'km-KH' : 'en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }).format(new Date(value));
        },
        [locale],
    );

    const value = useMemo(
        () => ({ locale, setLocale, t, pick, formatDate, isKhmer: locale === 'km' }),
        [locale, t, pick, formatDate],
    );

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
    const context = useContext(LocaleContext);

    if (!context) {
        throw new Error('useLocale must be used within LocaleProvider');
    }

    return context;
}
