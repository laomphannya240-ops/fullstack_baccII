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
        'Practice Exercises': 'លំហាត់អនុវត្ត',
        'Formula / Theory': 'រូបមន្ត / ទ្រឹស្ដី',
        'Reference content': 'ខ្លឹមសារយោង',
        'Exercise results': 'លទ្ធផលលំហាត់',
        'Quick references': 'យោងរហ័ស',
        'Formula sheets, definitions and exam notes for this subject.': 'តារាងរូបមន្ត និយមន័យ និងកំណត់ចំណាំសម្រាប់មុខវិជ្ជានេះ។',
        'Quick practice': 'ហាត់រហ័ស',
        'Recently practiced exercises': 'លំហាត់ដែលបានហាត់ថ្មីៗ',
        'Recently viewed references': 'ឯកសារយោងដែលបានមើលថ្មីៗ',
        'Your exercise history will appear here.': 'ប្រវត្តិលំហាត់របស់អ្នកនឹងបង្ហាញនៅទីនេះ។',
        'Study activity': 'សកម្មភាពសិក្សា',
        'Actions in the last 7 days': 'សកម្មភាពក្នុងរយៈពេល ៧ ថ្ងៃចុងក្រោយ',
        'Completion overview': 'ទិដ្ឋភាពការបញ្ចប់',
        'Overall progress': 'វឌ្ឍនភាពសរុប',
        'Total exercises': 'លំហាត់សរុប',
        'Exercise completion': 'ការបញ្ចប់លំហាត់',
        'Lessons completed': 'មេរៀនដែលបានបញ្ចប់',
        'Lessons and exercises': 'មេរៀន និងលំហាត់',
        'Welcome': 'សូមស្វាគមន៍',
        'Study track': 'ជំនាញសិក្សា',
        'Choose a subject to see its chapters and practice activities.': 'ជ្រើសមុខវិជ្ជាដើម្បីមើលជំពូក និងសកម្មភាពហាត់។',
        'Start with a question you have not completed.': 'ចាប់ផ្ដើមជាមួយសំណួរដែលអ្នកមិនទាន់បញ្ចប់។',
        'Select': 'ជ្រើសរើស',
        'Selected': 'បានជ្រើសរើស',
        'Clear': 'សម្អាត',
        'All chapters': 'គ្រប់ជំពូក',
        'All difficulty': 'គ្រប់កម្រិត',
        'All types': 'គ្រប់ប្រភេទ',
        'Retry': 'ព្យាយាមម្ដងទៀត',
        'Language': 'ភាសា',
        'My Progress': 'វឌ្ឍនភាពរបស់ខ្ញុំ',
        'Home': 'ទំព័រដើម',
        'Track': 'ជំនាញ',
        'Subject': 'មុខវិជ្ជា',
        'Chapter': 'ជំពូក',
        'Status': 'ស្ថានភាព',
        'Actions': 'សកម្មភាព',
        'Title': 'ចំណងជើង',
        'Type': 'ប្រភេទ',
        'Image': 'រូបភាព',
        'Files': 'ឯកសារ',
        'files': 'ឯកសារ',
        'file': 'ឯកសារ',
        'Open': 'បើក',
        'Open material': 'បើកឯកសារ',
        'Preview': 'មើលជាមុន',
        'Draft': 'សេចក្តីព្រាង',
        'Shared': 'បានចែករំលែក',
        'Page': 'ទំព័រ',
        'Next': 'បន្ទាប់',
        'Previous': 'មុន',
        'Clear filters': 'សម្អាតតម្រង',
        'No file available': 'គ្មានឯកសារទេ',
        'Fullscreen': 'ពេញអេក្រង់',
        'Zoom in': 'ពង្រីក',
        'Zoom out': 'បង្រួម',
        'Previous page': 'ទំព័រមុន',
        'Next page': 'ទំព័របន្ទាប់',
        'Previous image': 'រូបភាពមុន',
        'Next image': 'រូបភាពបន្ទាប់',
        'Preview is not available for this file type': 'មិនអាចមើលជាមុនសម្រាប់ប្រភេទឯកសារនេះទេ',
        'Notes, formula sheets and revision guides shared by your school.': 'កំណត់ចំណាំ តារាងរូបមន្ត និងមគ្គុទ្ទេសក៍ពិនិត្យពីសាលារបស់អ្នក។',
        'Read revision notes and guides directly in your browser.': 'អានកំណត់ចំណាំ និងមគ្គុទ្ទេសក៍ដោយផ្ទាល់នៅក្នុងកម្មវិធីរុករករបស់អ្នក។',
        'Recently viewed': 'បានមើលថ្មីៗ',
        'Choose a subject and chapter to find revision notes and images.': 'ជ្រើសមុខវិជ្ជា និងជំពូក ដើម្បីរកកំណត់ចំណាំ និងរូបភាព។',
        'Revision notes for this subject': 'កំណត់ចំណាំសម្រាប់មុខវិជ្ជានេះ',
        'No materials for this subject yet.': 'មិនទាន់មានឯកសារសម្រាប់មុខវិជ្ជានេះទេ។',
        'Upload revision notes, formula sheets and guides for students to read and download.': 'បង្ហោះកំណត់ចំណាំ តារាងរូបមន្ត និងមគ្គុទ្ទេសក៍ ដើម្បីឱ្យសិស្សអាន និងទាញយក។',
        'New material': 'ឯកសារថ្មី',
        'Edit material': 'កែសម្រួលឯកសារ',
        'Title (English)': 'ចំណងជើង (អង់គ្លេស)',
        'Title (Khmer)': 'ចំណងជើង (ខ្មែរ)',
        'Description': 'ការពិពណ៌នា',
        'Files (PDF or images)': 'ឯកសារ (PDF ឬរូបភាព)',
        'Current files': 'ឯកសារបច្ចុប្បន្ន',
        'Replace all files': 'ជំនួសឯកសារទាំងអស់',
        'Remove selected': 'លុបដែលបានជ្រើស',
        'Accepted: PDF, JPG, JPEG, PNG, WEBP up to 20 MB each.': 'ទទួលយក៖ PDF, JPG, JPEG, PNG, WEBP រហូតដល់ ២០ MB ក្នុងមួយឯកសារ។',
        'A material can contain one PDF or multiple images, not both.': 'ឯកសារមួយអាចមាន PDF តែមួយ ឬរូបភាពច្រើន ប៉ុន្តែមិនអាចមានទាំងពីរបានទេ។',
        'Choose at least one file.': 'សូមជ្រើសឯកសារយ៉ាងតិចមួយ។',
        'Only PDF and image files are supported.': 'គាំទ្រតែឯកសារ PDF និងរូបភាពប៉ុណ្ណោះ។',
        'Upload only one PDF per material.': 'សូមបង្ហោះ PDF តែមួយសម្រាប់ឯកសារនីមួយៗ។',
        'Do not mix PDF and image files.': 'កុំលាយឯកសារ PDF និងរូបភាពជាមួយគ្នា។',
        'No more than 20 files.': 'អាចបង្ហោះបានតែ ២០ ឯកសារប៉ុណ្ណោះ។',
        'Keep at least one file in the material.': 'សូមរក្សាឯកសារយ៉ាងតិចមួយនៅក្នុងឯកសារនេះ។',
        'No materials yet': 'មិនទាន់មានឯកសារ',
        'Upload your first material to get started.': 'សូមបង្ហោះឯកសារដំបូងរបស់អ្នកដើម្បីចាប់ផ្ដើម។',
        'Delete this material?': 'លុបឯកសារនេះ?',
        'This cannot be undone.': 'សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយបានទេ។',
        'Material uploaded.': 'បានបង្ហោះឯកសារ។',
        'Material updated.': 'បានធ្វើបច្ចុប្បន្នភាពឯកសារ។',
        'Material deleted.': 'បានលុបឯកសារ។',
        'Welcome to BAC II StudyHub': 'សូមស្វាគមន៍មកកាន់ BAC II StudyHub',
        'Your free companion for Grade 12 success': 'មិត្តរួមដំណើរឥតគិតថ្លៃសម្រាប់ជោគជ័យថ្នាក់ទី១២',
        'Learn at your own pace with bilingual lessons, practice questions and revision materials made for Cambodian students.': 'រៀនតាមល្បឿនរបស់អ្នក ជាមួយមេរៀនទ្វេភាសា សំណួរហាត់ និងឯកសារពិនិត្យ ដែលបានរៀបចំសម្រាប់សិស្សខ្មែរ។',
        'Bilingual lessons': 'មេរៀនទ្វេភាសា',
        'Practice anytime': 'ហាត់គ្រប់ពេល',
        'Study materials': 'ឯកសារសិក្សា',
        'Create a free account to save progress and bookmarks.': 'បង្កើតគណនីឥតគិតថ្លៃ ដើម្បីរក្សាវឌ្ឍនភាព និងចំណាំរបស់អ្នក។',
        'Already registered?': 'បានចុះឈ្មោះហើយ?',
    },
};

const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
    const [locale, setLocale] = useState(() => localStorage.getItem(LOCALE_KEY) || 'km');

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
