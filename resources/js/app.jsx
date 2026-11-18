import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout, PublicLayout, StudentLayout } from './components/Layouts';
import { GuestRoute, ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { LocaleProvider } from './contexts/LocaleContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import Login from './pages/auth/Login';
import { ForgotPassword, ResetPassword } from './pages/auth/PasswordPages';
import Register from './pages/auth/Register';
import { Announcements, Materials, SubjectDetail, Subjects } from './pages/public/Catalog';
import Home from './pages/public/Home';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminCategories from './pages/admin/Categories';
import AdminChapters from './pages/admin/Chapters';
import AdminDashboard from './pages/admin/Dashboard';
import AdminExercises from './pages/admin/Exercises';
import AdminLessons from './pages/admin/Lessons';
import AdminMaterials from './pages/admin/Materials';
import AdminMockExams from './pages/admin/MockExams';
import AdminProfile from './pages/admin/Profile';
import AdminProgress from './pages/admin/Progress';
import AdminQuizzes from './pages/admin/Quizzes';
import AdminStudents from './pages/admin/Students';
import AdminSubjects from './pages/admin/Subjects';
import AdminTracks from './pages/admin/Tracks';
import BookmarksPage from './pages/student/Bookmarks';
import StudentDashboard from './pages/student/Dashboard';
import { ExamsPage, ExamAttemptPage } from './pages/student/Exams';
import ExercisesPage from './pages/student/Exercises';
import HistoryPage from './pages/student/History';
import { LessonReader, StudentMaterials, StudentSubjects, SubjectOverview } from './pages/student/Learning';
import ProfilePage from './pages/student/ProfilePage';
import StudentProgressPage from './pages/student/Progress';
import { QuizzesPage, QuizAttemptPage } from './pages/student/Quizzes';
import SelectTrackPage from './pages/student/SelectTrack';
import '../css/app.css';

function NotFound() {
    return (
        <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
            <p className="text-6xl font-bold text-brand-600">404</p>
            <h1 className="mt-3 text-2xl font-semibold">Page not found</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">The page you are looking for does not exist or has moved.</p>
            <Link to="/" className="btn-primary mt-6">Back to home</Link>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<PublicLayout />}>
                    <Route index element={<Home />} />
                    <Route path="subjects" element={<Subjects />} />
                    <Route path="subjects/:id" element={<SubjectDetail />} />
                    <Route path="materials" element={<Materials />} />
                    <Route path="announcements" element={<Announcements />} />
                </Route>

                <Route element={<GuestRoute />}>
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                    <Route path="reset-password" element={<ResetPassword />} />
                </Route>

                <Route element={<ProtectedRoute role="student" />}>
                    <Route path="app" element={<StudentLayout />}>
                        <Route index element={<StudentDashboard />} />
                        <Route path="subjects" element={<StudentSubjects />} />
                        <Route path="subjects/:id" element={<SubjectOverview />} />
                        <Route path="lessons/:id" element={<LessonReader />} />
                        <Route path="exercises" element={<ExercisesPage />} />
                        <Route path="quizzes" element={<QuizzesPage />} />
                        <Route path="quiz-attempts/:attemptId" element={<QuizAttemptPage />} />
                        <Route path="exams" element={<ExamsPage />} />
                        <Route path="exam-attempts/:attemptId" element={<ExamAttemptPage />} />
                        <Route path="progress" element={<StudentProgressPage />} />
                        <Route path="bookmarks" element={<BookmarksPage />} />
                        <Route path="materials" element={<StudentMaterials />} />
                        <Route path="history" element={<HistoryPage />} />
                        <Route path="select-track" element={<SelectTrackPage />} />
                        <Route path="profile" element={<ProfilePage />} />
                    </Route>
                </Route>

                <Route element={<ProtectedRoute role="admin" />}>
                    <Route path="admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="students" element={<AdminStudents />} />
                        <Route path="tracks" element={<AdminTracks />} />
                        <Route path="categories" element={<AdminCategories />} />
                        <Route path="subjects" element={<AdminSubjects />} />
                        <Route path="chapters" element={<AdminChapters />} />
                        <Route path="lessons" element={<AdminLessons />} />
                        <Route path="exercises" element={<AdminExercises />} />
                        <Route path="quizzes" element={<AdminQuizzes />} />
                        <Route path="exams" element={<AdminMockExams />} />
                        <Route path="materials" element={<AdminMaterials />} />
                        <Route path="announcements" element={<AdminAnnouncements />} />
                        <Route path="progress" element={<AdminProgress />} />
                        <Route path="profile" element={<AdminProfile />} />
                    </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ThemeProvider>
            <LocaleProvider>
                <ToastProvider>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </ToastProvider>
            </LocaleProvider>
        </ThemeProvider>
    </StrictMode>,
);
