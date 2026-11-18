<?php

use App\Http\Controllers\API\Admin\AdminAnnouncementController;
use App\Http\Controllers\API\Admin\AdminChapterController;
use App\Http\Controllers\API\Admin\AdminDashboardController;
use App\Http\Controllers\API\Admin\AdminExerciseController;
use App\Http\Controllers\API\Admin\AdminLessonController;
use App\Http\Controllers\API\Admin\AdminMaterialController;
use App\Http\Controllers\API\Admin\AdminMockExamController;
use App\Http\Controllers\API\Admin\AdminQuizController;
use App\Http\Controllers\API\Admin\AdminStudentController;
use App\Http\Controllers\API\Admin\AdminSubjectController;
use App\Http\Controllers\API\Admin\AdminTrackController;
use App\Http\Controllers\API\AnnouncementController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\BookmarkController;
use App\Http\Controllers\API\ExerciseController;
use App\Http\Controllers\API\LessonController;
use App\Http\Controllers\API\MockExamController;
use App\Http\Controllers\API\ProgressController;
use App\Http\Controllers\API\PublicController;
use App\Http\Controllers\API\QuizController;
use App\Http\Controllers\API\StudyMaterialController;
use App\Http\Controllers\API\SubjectController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    // Public
    Route::get('/tracks', [PublicController::class, 'tracks']);
    Route::get('/stats', [PublicController::class, 'stats']);
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::get('/announcements/{announcement}', [AnnouncementController::class, 'show']);
    Route::get('/subjects', [SubjectController::class, 'index']);
    Route::get('/subjects/{subject}', [SubjectController::class, 'show']);
    Route::get('/materials', [StudyMaterialController::class, 'index']);
    Route::get('/materials/{material}', [StudyMaterialController::class, 'show']);

    // Authentication
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

    Route::middleware(['auth:sanctum', 'active'])->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/password', [AuthController::class, 'changePassword']);
        Route::put('/select-track', [AuthController::class, 'selectTrack']);

        // Subjects and lessons
        Route::get('/lessons', [LessonController::class, 'index']);
        Route::get('/lessons/{lesson}', [LessonController::class, 'show']);
        Route::post('/lessons/{lesson}/progress', [LessonController::class, 'markProgress']);

        // Exercises
        Route::get('/exercises', [ExerciseController::class, 'index']);
        Route::get('/exercises/{exercise}', [ExerciseController::class, 'show']);
        Route::post('/exercises/{exercise}/submit', [ExerciseController::class, 'submit']);
        Route::get('/exercise-attempts', [ExerciseController::class, 'history']);

        // Quizzes
        Route::get('/quizzes', [QuizController::class, 'index']);
        Route::get('/quizzes/{quiz}', [QuizController::class, 'show']);
        Route::post('/quizzes/{quiz}/start', [QuizController::class, 'start']);
        Route::get('/quiz-attempts', [QuizController::class, 'history']);
        Route::get('/quiz-attempts/{attempt}', [QuizController::class, 'attempt']);
        Route::post('/quiz-attempts/{attempt}/submit', [QuizController::class, 'submit']);

        // Mock exams
        Route::get('/mock-exams', [MockExamController::class, 'index']);
        Route::get('/mock-exams/{exam}', [MockExamController::class, 'show']);
        Route::post('/mock-exams/{exam}/start', [MockExamController::class, 'start']);
        Route::get('/exam-attempts', [MockExamController::class, 'history']);
        Route::get('/exam-attempts/{attempt}', [MockExamController::class, 'attempt']);
        Route::post('/exam-attempts/{attempt}/answers', [MockExamController::class, 'saveAnswer']);
        Route::post('/exam-attempts/{attempt}/submit', [MockExamController::class, 'submit']);

        // Progress, bookmarks, materials, announcements
        Route::get('/progress/dashboard', [ProgressController::class, 'dashboard']);
        Route::get('/progress/history', [ProgressController::class, 'history']);
        Route::get('/progress/activities', [ProgressController::class, 'activities']);
        Route::get('/bookmarks', [BookmarkController::class, 'index']);
        Route::post('/bookmarks/toggle', [BookmarkController::class, 'toggle']);
        Route::delete('/bookmarks/{bookmark}', [BookmarkController::class, 'destroy']);

        // Admin
        Route::prefix('admin')->middleware('role:admin')->group(function (): void {
            Route::get('/dashboard', [AdminDashboardController::class, 'index']);

            Route::get('/students', [AdminStudentController::class, 'index']);
            Route::get('/students/{student}', [AdminStudentController::class, 'show']);
            Route::put('/students/{student}', [AdminStudentController::class, 'update']);
            Route::get('/students/{student}/progress', [AdminStudentController::class, 'progress']);
            Route::delete('/students/{student}', [AdminStudentController::class, 'destroy']);

            Route::get('/tracks', [AdminTrackController::class, 'index']);
            Route::post('/tracks', [AdminTrackController::class, 'store']);
            Route::get('/tracks/{track}', [AdminTrackController::class, 'show']);
            Route::put('/tracks/{track}', [AdminTrackController::class, 'update']);
            Route::delete('/tracks/{track}', [AdminTrackController::class, 'destroy']);

            Route::get('/subjects', [AdminSubjectController::class, 'index']);
            Route::post('/subjects', [AdminSubjectController::class, 'store']);
            Route::get('/subjects/{subject}', [AdminSubjectController::class, 'show']);
            Route::put('/subjects/{subject}', [AdminSubjectController::class, 'update']);
            Route::delete('/subjects/{subject}', [AdminSubjectController::class, 'destroy']);

            Route::get('/chapters', [AdminChapterController::class, 'index']);
            Route::post('/chapters', [AdminChapterController::class, 'store']);
            Route::get('/chapters/{chapter}', [AdminChapterController::class, 'show']);
            Route::put('/chapters/{chapter}', [AdminChapterController::class, 'update']);
            Route::delete('/chapters/{chapter}', [AdminChapterController::class, 'destroy']);

            Route::get('/lessons', [AdminLessonController::class, 'index']);
            Route::post('/lessons', [AdminLessonController::class, 'store']);
            Route::get('/lessons/{lesson}', [AdminLessonController::class, 'show']);
            Route::put('/lessons/{lesson}', [AdminLessonController::class, 'update']);
            Route::delete('/lessons/{lesson}', [AdminLessonController::class, 'destroy']);

            Route::get('/exercises', [AdminExerciseController::class, 'index']);
            Route::post('/exercises', [AdminExerciseController::class, 'store']);
            Route::get('/exercises/{exercise}', [AdminExerciseController::class, 'show']);
            Route::put('/exercises/{exercise}', [AdminExerciseController::class, 'update']);
            Route::delete('/exercises/{exercise}', [AdminExerciseController::class, 'destroy']);

            Route::get('/quizzes', [AdminQuizController::class, 'index']);
            Route::post('/quizzes', [AdminQuizController::class, 'store']);
            Route::get('/quizzes/{quiz}', [AdminQuizController::class, 'show']);
            Route::put('/quizzes/{quiz}', [AdminQuizController::class, 'update']);
            Route::delete('/quizzes/{quiz}', [AdminQuizController::class, 'destroy']);

            Route::get('/mock-exams', [AdminMockExamController::class, 'index']);
            Route::post('/mock-exams', [AdminMockExamController::class, 'store']);
            Route::get('/mock-exams/{exam}', [AdminMockExamController::class, 'show']);
            Route::put('/mock-exams/{exam}', [AdminMockExamController::class, 'update']);
            Route::delete('/mock-exams/{exam}', [AdminMockExamController::class, 'destroy']);

            Route::get('/announcements', [AdminAnnouncementController::class, 'index']);
            Route::post('/announcements', [AdminAnnouncementController::class, 'store']);
            Route::get('/announcements/{announcement}', [AdminAnnouncementController::class, 'show']);
            Route::put('/announcements/{announcement}', [AdminAnnouncementController::class, 'update']);
            Route::delete('/announcements/{announcement}', [AdminAnnouncementController::class, 'destroy']);

            Route::get('/materials', [AdminMaterialController::class, 'index']);
            Route::post('/materials', [AdminMaterialController::class, 'store']);
            Route::get('/materials/{material}', [AdminMaterialController::class, 'show']);
            Route::put('/materials/{material}', [AdminMaterialController::class, 'update']);
            Route::delete('/materials/{material}', [AdminMaterialController::class, 'destroy']);
        });
    });
});
