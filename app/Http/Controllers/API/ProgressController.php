<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Models\ExerciseAttempt;
use App\Models\LessonProgress;
use App\Models\MockExamAttempt;
use App\Models\QuizAttempt;
use App\Models\StudyActivity;
use App\Services\ProgressService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function dashboard(Request $request, ProgressService $progress): JsonResponse
    {
        return ApiResponse::success($progress->dashboard($request->user()));
    }

    public function history(Request $request): JsonResponse
    {
        $user = $request->user();

        return ApiResponse::success([
            'lesson_progress' => LessonProgress::where('user_id', $user->id)
                ->with('lesson.chapter.subject:id,name_en,name_km,slug')
                ->latest('updated_at')
                ->limit(20)
                ->get(),
            'exercise_attempts' => ExerciseAttempt::where('user_id', $user->id)
                ->with('exercise.subject:id,name_en,name_km')
                ->latest()
                ->limit(20)
                ->get(),
            'quiz_attempts' => QuizAttempt::where('user_id', $user->id)
                ->where('status', 'completed')
                ->with('quiz.subject:id,name_en,name_km')
                ->latest('submitted_at')
                ->limit(20)
                ->get(),
            'exam_attempts' => MockExamAttempt::where('user_id', $user->id)
                ->where('status', 'completed')
                ->with('mockExam.subject:id,name_en,name_km')
                ->latest('submitted_at')
                ->limit(20)
                ->get(),
        ]);
    }

    public function activities(Request $request): JsonResponse
    {
        $activities = StudyActivity::where('user_id', $request->user()->id)
            ->with('subject:id,name_en,name_km')
            ->latest('occurred_at')
            ->paginate($request->integer('per_page', 20));

        return ApiResponse::success(ActivityResource::collection($activities), null, ApiResponse::pagination($activities));
    }
}
